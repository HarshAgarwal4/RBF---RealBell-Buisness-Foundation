import axios from 'axios';
import CertificateModel from '../models/certificate.js';
import CertificateTemplateModel from '../models/certificateTemplate.js';
import CertificateAuditModel from '../models/certificateAudit.js';
import { logAudit } from '../../services/auditLogger.js';

export const proxyImage = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ status: 0, msg: "URL is required" });

        if (url.startsWith('data:image')) {
            return res.json({ status: 1, base64: url });
        }

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        const contentType = response.headers['content-type'] || 'image/png';
        const base64 = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;

        return res.json({ status: 1, base64 });
    } catch (error) {
        console.error("Proxy image error:", error.message);
        return res.status(500).json({ status: 0, msg: error.message });
    }
};

export const verifyCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;
        const certificate = await CertificateModel.findOne({ certificateId });
        
        if (!certificate) {
            return res.json({ status: 0, msg: 'Certificate not found', valid: false });
        }

        if (certificate.status === 'valid') {
            if (certificate.expiryDate && new Date() > new Date(certificate.expiryDate)) {
                certificate.status = 'expired';
                await certificate.save();
            }
        }

        await CertificateAuditModel.create({
            certificate: certificate._id,
            action: 'verified',
            performedBy: null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        const publicData = {
            valid: certificate.status === 'valid',
            status: certificate.status,
            candidateName: certificate.candidateName,
            certificateId: certificate.certificateId,
            registrationId: certificate.registrationId,
            testName: certificate.testName,
            domain: certificate.domain,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            result: certificate.result,
            collaboratingOrgs: certificate.collaboratingOrgs ? certificate.collaboratingOrgs.map(org => org.name) : [],
            verifiedAt: new Date()
        };

        if (certificate.status === 'expired') {
            publicData.expiredAt = certificate.expiryDate;
        } else if (certificate.status === 'revoked') {
            publicData.revokedAt = certificate.revokedAt;
        }

        return res.json({ status: 1, msg: 'Certificate verified', data: publicData });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error verifying certificate', error: error.message });
    }
};

export const getAllCertificates = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { candidateName: { $regex: search, $options: 'i' } },
                { certificateId: { $regex: search, $options: 'i' } },
                { registrationId: { $regex: search, $options: 'i' } }
            ];
        }

        const certificates = await CertificateModel.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'test',
                select: 'title domain certificateTemplate collaboratingOrgs',
                populate: { path: 'collaboratingOrgs' }
            })
            .populate('template')
            .sort({ issueDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const total = await CertificateModel.countDocuments(query);

        return res.json({ status: 1, msg: 'Certificates retrieved', data: { certificates, total, page, limit } });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error retrieving certificates', error: error.message });
    }
};

export const getCertificateDetail = async (req, res) => {
    try {
        const certificate = await CertificateModel.findById(req.params.id)
            .populate('user', 'name email company_name')
            .populate({
                path: 'test',
                select: 'title domain certificateTemplate collaboratingOrgs',
                populate: { path: 'collaboratingOrgs' }
            })
            .populate('template')
            .populate('testAttempt', 'obtainedMarks totalMarks percentage');
            
        if (!certificate) return res.json({ status: 0, msg: 'Certificate not found' });
        
        return res.json({ status: 1, msg: 'Certificate detail retrieved', data: certificate });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error retrieving certificate', error: error.message });
    }
};

export const revokeCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) return res.json({ status: 0, msg: 'Revocation reason is required' });

        const certificate = await CertificateModel.findById(id);
        if (!certificate) return res.json({ status: 0, msg: 'Certificate not found' });
        if (certificate.status !== 'valid') return res.json({ status: 0, msg: 'Only valid certificates can be revoked' });

        certificate.status = 'revoked';
        certificate.revokedAt = new Date();
        certificate.revokedBy = req.user._id;
        certificate.revocationReason = reason;
        await certificate.save();

        await CertificateAuditModel.create({
            certificate: certificate._id,
            action: 'revoked',
            performedBy: req.user._id,
            details: { reason }
        });

        await logAudit({
            action: 'REVOKE_CERTIFICATE',
            performedBy: req.user._id,
            targetType: 'Certificate',
            targetId: certificate._id,
            details: { reason },
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: 'Certificate revoked', data: certificate });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error revoking certificate', error: error.message });
    }
};

export const restoreCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) return res.json({ status: 0, msg: 'Restore reason is required' });

        const certificate = await CertificateModel.findById(id);
        if (!certificate) return res.json({ status: 0, msg: 'Certificate not found' });
        if (certificate.status !== 'revoked') return res.json({ status: 0, msg: 'Only revoked certificates can be restored' });

        certificate.status = 'valid';
        certificate.restoredAt = new Date();
        certificate.restoredBy = req.user._id;
        certificate.restoreReason = reason;
        certificate.revokedAt = undefined;
        certificate.revokedBy = undefined;
        certificate.revocationReason = undefined;
        await certificate.save();

        await CertificateAuditModel.create({
            certificate: certificate._id,
            action: 'restored',
            performedBy: req.user._id,
            details: { reason }
        });

        await logAudit({
            action: 'RESTORE_CERTIFICATE',
            performedBy: req.user._id,
            targetType: 'Certificate',
            targetId: certificate._id,
            details: { reason },
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: 'Certificate restored', data: certificate });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error restoring certificate', error: error.message });
    }
};

export const searchCertificates = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        let query = {};
        if (q) {
            query.$or = [
                { candidateName: { $regex: q, $options: 'i' } },
                { certificateId: { $regex: q, $options: 'i' } },
                { registrationId: { $regex: q, $options: 'i' } }
            ];
        }

        const certificates = await CertificateModel.find(query)
            .populate('user', 'name email')
            .populate('test', 'title')
            .sort({ issueDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const total = await CertificateModel.countDocuments(query);

        return res.json({ status: 1, msg: 'Certificates searched', data: { certificates, total, page, limit } });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error searching certificates', error: error.message });
    }
};

export const getCertificateAudit = async (req, res) => {
    try {
        const audits = await CertificateAuditModel.find({ certificate: req.params.id })
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 });
            
        return res.json({ status: 1, msg: 'Audit log retrieved', data: audits });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error retrieving audit log', error: error.message });
    }
};

export const createTemplate = async (req, res) => {
    try {
        const { name, type, description, htmlTemplate, headerConfig, footerConfig, isDefault } = req.body;
        
        if (isDefault) {
            await CertificateTemplateModel.updateMany({ type }, { isDefault: false });
        }

        const template = await CertificateTemplateModel.create({
            name,
            type,
            description,
            htmlTemplate,
            headerConfig,
            footerConfig,
            isDefault,
            createdBy: req.user._id
        });

        await logAudit({
            action: 'CREATE_CERTIFICATE_TEMPLATE',
            performedBy: req.user._id,
            targetType: 'CertificateTemplate',
            targetId: template._id,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: 'Template created', data: template });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error creating template', error: error.message });
    }
};

export const getTemplates = async (req, res) => {
    try {
        const { type, status } = req.query;
        let query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const templates = await CertificateTemplateModel.find(query).sort({ isDefault: -1, name: 1 });
        return res.json({ status: 1, msg: 'Templates retrieved', data: templates });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error retrieving templates', error: error.message });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const { isDefault } = req.body;
        const templateId = req.params.id;

        const template = await CertificateTemplateModel.findById(templateId);
        if (!template) return res.json({ status: 0, msg: 'Template not found' });

        if (isDefault && !template.isDefault) {
            await CertificateTemplateModel.updateMany({ type: template.type }, { isDefault: false });
        }

        const updated = await CertificateTemplateModel.findByIdAndUpdate(templateId, req.body, { new: true });

        await logAudit({
            action: 'UPDATE_CERTIFICATE_TEMPLATE',
            performedBy: req.user._id,
            targetType: 'CertificateTemplate',
            targetId: updated._id,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: 'Template updated', data: updated });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error updating template', error: error.message });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        const template = await CertificateTemplateModel.findById(req.params.id);
        if (!template) return res.json({ status: 0, msg: 'Template not found' });
        
        if (template.isDefault) {
            return res.json({ status: 0, msg: 'Cannot delete default template' });
        }

        await CertificateTemplateModel.findByIdAndDelete(req.params.id);

        await logAudit({
            action: 'DELETE_CERTIFICATE_TEMPLATE',
            performedBy: req.user._id,
            targetType: 'CertificateTemplate',
            targetId: template._id,
            ipAddress: req.ip
        });

        return res.json({ status: 1, msg: 'Template deleted' });
    } catch (error) {
        return res.json({ status: 0, msg: 'Error deleting template', error: error.message });
    }
};

/**
 * Seed default certificate templates on server startup
 */
export async function seedDefaultCertificateTemplates() {
    try {
        const existingCount = await CertificateTemplateModel.countDocuments();
        if (existingCount > 0) return;

        const rbfOnlyTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; padding:0; font-family:'Georgia','Times New Roman',serif; background:#fff; }
  .cert-container { width:900px; min-height:636px; margin:0 auto; border:3px solid {{primaryColor}}; padding:50px 60px; position:relative; box-sizing:border-box; }
  .cert-border { border:1px solid {{secondaryColor}}; padding:40px 50px; min-height:536px; box-sizing:border-box; }
  .cert-header { text-align:center; margin-bottom:30px; }
  .cert-logo { height:60px; margin-bottom:10px; }
  .cert-title { font-size:28px; font-weight:bold; color:{{primaryColor}}; letter-spacing:2px; text-transform:uppercase; margin:10px 0 5px; }
  .cert-subtitle { font-size:14px; color:#666; letter-spacing:1px; }
  .cert-body { text-align:center; margin:25px 0; }
  .cert-label { font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:5px; }
  .cert-name { font-size:32px; font-weight:bold; color:#1a1a1a; margin:10px 0; border-bottom:2px solid {{secondaryColor}}; display:inline-block; padding-bottom:5px; }
  .cert-desc { font-size:14px; color:#555; line-height:1.6; margin:15px 40px; }
  .cert-details { display:flex; justify-content:space-between; margin:20px 0; font-size:12px; color:#666; }
  .cert-details div { text-align:center; }
  .cert-details .value { font-size:14px; font-weight:bold; color:#333; margin-top:3px; }
  .cert-footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:30px; padding-top:20px; border-top:1px solid #eee; }
  .cert-qr img { width:100px; height:100px; }
  .cert-signature { text-align:center; }
  .cert-signature img { height:40px; margin-bottom:5px; }
  .cert-sig-name { font-size:13px; font-weight:bold; color:#333; }
  .cert-sig-title { font-size:11px; color:#888; }
  .cert-ids { text-align:right; font-size:10px; color:#999; }
  .cert-ids div { margin-bottom:2px; }
</style>
</head>
<body>
<div class="cert-container">
  <div class="cert-border">
    <div class="cert-header">
      <div class="cert-title">Realbell Business Foundation</div>
      <div class="cert-subtitle">Certificate of Achievement</div>
    </div>
    <div class="cert-body">
      <div class="cert-label">This is to certify that</div>
      <div class="cert-name">{{candidateName}}</div>
      <div class="cert-desc">has successfully completed the assessment <strong>{{testName}}</strong> in the domain of <strong>{{domain}}</strong> with a score of <strong>{{score}}</strong> marks ({{percentage}}%).</div>
    </div>
    <div class="cert-details">
      <div><div class="cert-label">Certificate ID</div><div class="value">{{certificateId}}</div></div>
      <div><div class="cert-label">Issue Date</div><div class="value">{{issueDate}}</div></div>
      <div><div class="cert-label">Registration ID</div><div class="value">{{registrationId}}</div></div>
    </div>
    <div class="cert-footer">
      <div class="cert-qr"><img src="{{qrCodeDataUrl}}" alt="QR Code" /></div>
      <div class="cert-signature">
        <div class="cert-sig-name">{{signerName}}</div>
        <div class="cert-sig-title">{{signerTitle}}</div>
      </div>
      <div class="cert-ids">
        <div>Verify at: {{verificationUrl}}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

        const rbfCollabTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; padding:0; font-family:'Georgia','Times New Roman',serif; background:#fff; }
  .cert-container { width:900px; min-height:636px; margin:0 auto; border:3px solid {{primaryColor}}; padding:50px 60px; position:relative; box-sizing:border-box; }
  .cert-border { border:1px solid {{secondaryColor}}; padding:40px 50px; min-height:536px; box-sizing:border-box; }
  .cert-header { text-align:center; margin-bottom:25px; }
  .cert-logo { height:60px; margin-bottom:10px; }
  .cert-title { font-size:28px; font-weight:bold; color:{{primaryColor}}; letter-spacing:2px; text-transform:uppercase; margin:10px 0 5px; }
  .cert-subtitle { font-size:14px; color:#666; letter-spacing:1px; }
  .cert-collab { font-size:13px; color:#888; margin-top:8px; }
  .cert-collab strong { color:#555; }
  .cert-body { text-align:center; margin:20px 0; }
  .cert-label { font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:5px; }
  .cert-name { font-size:32px; font-weight:bold; color:#1a1a1a; margin:10px 0; border-bottom:2px solid {{secondaryColor}}; display:inline-block; padding-bottom:5px; }
  .cert-desc { font-size:14px; color:#555; line-height:1.6; margin:15px 40px; }
  .cert-details { display:flex; justify-content:space-between; margin:20px 0; font-size:12px; color:#666; }
  .cert-details div { text-align:center; }
  .cert-details .value { font-size:14px; font-weight:bold; color:#333; margin-top:3px; }
  .cert-footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:25px; padding-top:15px; border-top:1px solid #eee; }
  .cert-qr img { width:100px; height:100px; }
  .cert-signature { text-align:center; }
  .cert-sig-name { font-size:13px; font-weight:bold; color:#333; }
  .cert-sig-title { font-size:11px; color:#888; }
  .cert-ids { text-align:right; font-size:10px; color:#999; }
</style>
</head>
<body>
<div class="cert-container">
  <div class="cert-border">
    <div class="cert-header">
      <div class="cert-title">Realbell Business Foundation</div>
      <div class="cert-subtitle">Certificate of Achievement</div>
      <div class="cert-collab">in collaboration with <strong>{{collaboratingOrgNames}}</strong></div>
    </div>
    <div class="cert-body">
      <div class="cert-label">This is to certify that</div>
      <div class="cert-name">{{candidateName}}</div>
      <div class="cert-desc">has successfully completed the assessment <strong>{{testName}}</strong> in the domain of <strong>{{domain}}</strong> with a score of <strong>{{score}}</strong> marks ({{percentage}}%).</div>
    </div>
    <div class="cert-details">
      <div><div class="cert-label">Certificate ID</div><div class="value">{{certificateId}}</div></div>
      <div><div class="cert-label">Issue Date</div><div class="value">{{issueDate}}</div></div>
      <div><div class="cert-label">Registration ID</div><div class="value">{{registrationId}}</div></div>
    </div>
    <div class="cert-footer">
      <div class="cert-qr"><img src="{{qrCodeDataUrl}}" alt="QR Code" /></div>
      <div class="cert-signature">
        <div class="cert-sig-name">{{signerName}}</div>
        <div class="cert-sig-title">{{signerTitle}}</div>
      </div>
      <div class="cert-ids">
        <div>Verify at: {{verificationUrl}}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

        await CertificateTemplateModel.create([
            {
                name: 'RBF Standard Certificate',
                type: 'rbf_only',
                description: 'Default RBF certificate template for assessments without external collaboration',
                isDefault: true,
                htmlTemplate: rbfOnlyTemplate,
                headerConfig: { primaryColor: '#1a237e', secondaryColor: '#c5a47e' },
                footerConfig: { signerName: 'Realbell Business Foundation', signerTitle: 'Authorized Signatory' },
                status: 'active'
            },
            {
                name: 'RBF Collaboration Certificate',
                type: 'rbf_collaboration',
                description: 'Default RBF certificate template for assessments conducted in collaboration with partner organizations',
                isDefault: true,
                htmlTemplate: rbfCollabTemplate,
                headerConfig: { primaryColor: '#1a237e', secondaryColor: '#c5a47e', showCollabLogo: true },
                footerConfig: { signerName: 'Realbell Business Foundation', signerTitle: 'Authorized Signatory' },
                status: 'active'
            }
        ]);
        console.log('Default certificate templates seeded successfully');
    } catch (error) {
        console.error('Error seeding certificate templates:', error.message);
    }
}
