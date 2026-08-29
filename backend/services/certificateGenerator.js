import CertificateModel from '../App/models/certificate.js';
import CertificateCounterModel from '../App/models/certificateCounter.js';
import CertificateTemplateModel from '../App/models/certificateTemplate.js';
import CertificateAuditModel from '../App/models/certificateAudit.js';
import TestAttemptModel from '../App/models/testAttempt.js';
import TestModel from '../App/models/test.js';
import OrganizationModel from '../App/models/organization.js';
import QRCode from 'qrcode';
import Handlebars from 'handlebars';
import { uploadFileToCloud } from './upload.js';
import dotenv from 'dotenv';

dotenv.config();

export async function generateUniqueId(prefix) {
  try {
    const year = new Date().getFullYear();
    const counter = await CertificateCounterModel.findOneAndUpdate(
      { key: prefix, year },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const seqPadded = (counter?.seq || 1).toString().padStart(6, '0');
    return `RBF-${prefix}-${year}-${seqPadded}`;
  } catch (err) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `RBF-${prefix}-${year}-${randomSuffix}`;
  }
}

export async function generateQRCode(certificateId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${baseUrl.replace(/\/$/, '')}/verify/certificate/${certificateId}`;
  const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
  return dataUrl;
}

export async function generateCertificatePDF(certificate, template) {
  try {
    const compiled = Handlebars.compile(template.htmlTemplate);
    const htmlStr = compiled({
      ...certificate.toObject(),
      verificationUrl: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/verify/certificate/${certificate.certificateId}`,
      collaboratingOrgNames: (certificate.collaboratingOrgs || []).map(o => o.name).join(', ')
    });
    
    // Upload to Cloudinary as HTML/raw file
    const buffer = Buffer.from(htmlStr, 'utf-8');
    const uploadResult = await uploadFileToCloud(buffer, 'RBF/certificates');
    certificate.pdfUrl = uploadResult?.secure_url || uploadResult?.url || '';
    certificate.pdfPublicId = uploadResult?.public_id || '';
    return htmlStr;
  } catch (err) {
    console.error("Certificate PDF/HTML upload note:", err.message);
    return '';
  }
}

export async function generateCertificate(attemptParam, testParam, userParam) {
  try {
    let attempt = attemptParam;
    if (typeof attempt === 'string') {
      attempt = await TestAttemptModel.findById(attempt);
    }
    if (!attempt) throw new Error('Test attempt not found');

    if (!attempt.passed || !attempt.evaluationComplete) {
      throw new Error('Test attempt has not passed evaluation and is not eligible for a certificate');
    }

    const testId = testParam?._id || testParam || attempt.test;
    const test = await TestModel.findById(testId)
      .populate('domain')
      .populate('collaboratingOrgs')
      .populate('certificateTemplate');
    if (!test) throw new Error('Associated test not found');

    const colOrgs = (test.collaboratingOrgs || []).map(org => {
      let logoUrl = '';
      if (org && typeof org === 'object') {
        logoUrl = org.logoUrl || (typeof org.logo === 'string' ? org.logo : org.logo?.url) || '';
      }
      return {
        name: org?.name || 'Partner Organization',
        logo: logoUrl
      };
    });

    let existing = await CertificateModel.findOne({ testAttempt: attempt._id });
    if (existing) {
      // Auto-heal any placeholder collaboratingOrgs data
      if (colOrgs.length > 0 && (!existing.collaboratingOrgs || existing.collaboratingOrgs.length === 0 || existing.collaboratingOrgs[0]?.name === 'Partner Organization')) {
        existing.collaboratingOrgs = colOrgs;
        if (!existing.template && test.certificateTemplate) {
          existing.template = test.certificateTemplate._id || test.certificateTemplate;
        }
        await existing.save();
      }
      return existing;
    }

    let user = userParam;
    if (!user || typeof user === 'string') {
      user = await OrganizationModel.findById(user || attempt.user);
    }
    if (!user) throw new Error('Candidate user not found');

    const certificateId = await generateUniqueId('CERT');
    const registrationId = await generateUniqueId('REG');

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await generateQRCode(certificateId);
    } catch (qrErr) {
      console.warn("QR code generation fallback:", qrErr.message);
    }

    let template = test.certificateTemplate;
    const hasCollab = test.collaboratingOrgs && test.collaboratingOrgs.length > 0;
    
    if (!template) {
      try {
        if (hasCollab) {
          template = await CertificateTemplateModel.findOne({ type: 'rbf_collaboration', isDefault: true }) ||
                     await CertificateTemplateModel.findOne({ type: 'rbf_collaboration' });
        } else {
          template = await CertificateTemplateModel.findOne({ type: 'rbf_only', isDefault: true }) ||
                     await CertificateTemplateModel.findOne({ type: 'rbf_only' });
        }
      } catch (tmplErr) {
        console.warn("Template fetch fallback:", tmplErr.message);
      }
    }

    let expiryDate = null;
    if (test.certificateValidityDays > 0) {
      expiryDate = new Date(Date.now() + test.certificateValidityDays * 24 * 60 * 60 * 1000);
    }

    const candidateName = user.name || user.company_name || user.email || 'Candidate';
    const domainName = test.domain?.name || (typeof test.domain === 'string' ? test.domain : 'General');

    const certificate = new CertificateModel({
      certificateId,
      registrationId,
      user: user._id,
      test: test._id,
      testAttempt: attempt._id,
      candidateName,
      testName: test.title,
      domain: domainName,
      score: attempt.obtainedMarks || 0,
      percentage: attempt.percentage || 0,
      result: 'pass',
      issueDate: new Date(),
      expiryDate,
      collaboratingOrgs: colOrgs,
      qrCodeDataUrl,
      status: 'valid',
      template: template?._id || null
    });

    if (template && template.htmlTemplate) {
      try {
        await generateCertificatePDF(certificate, template);
      } catch (pdfErr) {
        console.warn("PDF compilation fallback:", pdfErr.message);
      }
    }

    await certificate.save();

    try {
      await CertificateAuditModel.create({
        certificate: certificate._id,
        action: 'generated',
        performedBy: user._id,
        details: {
          certificateId,
          registrationId,
          score: attempt.obtainedMarks,
          percentage: attempt.percentage
        }
      });
    } catch (auditErr) {
      console.warn("Certificate audit log note:", auditErr.message);
    }

    return certificate;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}

