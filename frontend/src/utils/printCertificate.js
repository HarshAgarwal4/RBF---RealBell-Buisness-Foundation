import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useStore } from '../zustand/store';
import axios from '../services/axios';

/**
 * Robustly converts any external image URL to a local Base64 Data URL.
 * Uses the backend proxy to completely bypass browser CORS & canvas taint restrictions.
 */
async function convertImageUrlToBase64(url) {
  if (!url || url.startsWith('data:image')) return url;

  // Attempt 1: Server-side proxy (Node.js has zero CORS restrictions)
  try {
    const res = await axios.post('/certificates/proxy-image', { url });
    if (res.data?.status === 1 && res.data.base64 && res.data.base64.startsWith('data:image')) {
      return res.data.base64;
    }
  } catch (backendErr) {
    // Proceed to client-side fallback
  }

  // Attempt 2: Fetch blob
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (base64 && base64.startsWith('data:image')) {
        return base64;
      }
    }
  } catch (err) {
    // Continue
  }

  // Attempt 3: Image object with crossOrigin anonymous on canvas
  try {
    const base64 = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 150;
          canvas.height = img.naturalHeight || img.height || 150;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (canvasErr) {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
    if (base64 && base64.startsWith('data:image')) {
      return base64;
    }
  } catch (err) {
    // Fallback
  }

  return url;
}

export function getNormalizedCertificateData(cert) {
  const storeUser = useStore.getState?.()?.user;
  
  const candidateName = cert?.candidateName || 
                        cert?.user?.name || 
                        cert?.user?.company_name || 
                        storeUser?.name || 
                        storeUser?.company_name || 
                        'Candidate';

  const testTitle = cert?.test?.title || cert?.testName || 'Competency Assessment';
  const domain = cert?.test?.domain?.name || cert?.domain || 'Business Operations';
  
  let scoreVal = 0;
  if (cert?.percentage !== undefined && cert?.percentage !== null) {
    scoreVal = cert.percentage;
  } else if (cert?.score !== undefined && cert?.score !== null) {
    scoreVal = cert.score;
  } else if (cert?.obtainedMarks !== undefined && cert?.obtainedMarks !== null) {
    scoreVal = cert.obtainedMarks;
  }

  const certId = cert?.certificateId || cert?.certificate?.certificateId || 'RBF-CERT-2026-000001';
  const regId = cert?.registrationId || cert?.certificate?.registrationId || certId;
  const issueDate = new Date(cert?.issueDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rawCollabList = cert?.collaboratingOrgs || cert?.test?.collaboratingOrgs || [];
  const collabList = Array.isArray(rawCollabList) ? rawCollabList : [rawCollabList];
  
  const collabOrgNames = collabList
    .map(o => (typeof o === 'string' ? o : (o?.name || '')))
    .filter(Boolean)
    .join(', ');

  const collabLogos = collabList
    .map(o => {
      if (!o || typeof o === 'string') return '';
      return o.logoUrl || (typeof o.logo === 'string' ? o.logo : o.logo?.url) || '';
    })
    .filter(Boolean);

  const primaryCollabLogo = collabLogos[0] || '';
  const collabLogoHtml = primaryCollabLogo 
    ? `<img src="${primaryCollabLogo}" alt="" style="max-height: 44px; max-width: 140px; object-fit: contain; display: inline-block; vertical-align: middle;" />`
    : '';

  const qrUrl = cert?.qrCodeDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certId)}`;

  return {
    candidateName,
    testTitle,
    domain,
    score: scoreVal,
    certId,
    regId,
    issueDate,
    collabOrgs: collabOrgNames,
    collabOrgNames,
    primaryCollabLogo,
    collabLogoHtml,
    qrUrl
  };
}

/**
 * Builds the official certificate HTML using the exact template selected by the Admin
 */
export function buildOfficialTemplateHTML(data, cert = {}) {
  const template = cert?.template || cert?.test?.certificateTemplate || {};
  const primaryColor = template.headerConfig?.primaryColor || '#1e3a8a';
  const secondaryColor = template.headerConfig?.secondaryColor || '#b45309';
  const signerName = template.footerConfig?.signerName || 'Realbell Business Foundation';
  const signerTitle = template.footerConfig?.signerTitle || 'Authorized Signatory';
  const verificationUrl = `${window.location.origin}/verify/certificate/${data.certId}`;

  // If the admin configured custom HTML in the Certificate Builder, hydrate and use it
  if (template.htmlTemplate && template.htmlTemplate.trim()) {
    let customHtml = template.htmlTemplate;
    customHtml = customHtml.replace(/{{candidateName}}/g, data.candidateName);
    customHtml = customHtml.replace(/{{testName}}/g, data.testTitle);
    customHtml = customHtml.replace(/{{domain}}/g, data.domain);
    customHtml = customHtml.replace(/{{score}}/g, data.score.toString());
    customHtml = customHtml.replace(/{{percentage}}/g, data.score.toString());
    customHtml = customHtml.replace(/{{issueDate}}/g, data.issueDate);
    customHtml = customHtml.replace(/{{certificateId}}/g, data.certId);
    customHtml = customHtml.replace(/{{registrationId}}/g, data.regId);
    customHtml = customHtml.replace(/{{primaryColor}}/g, primaryColor);
    customHtml = customHtml.replace(/{{secondaryColor}}/g, secondaryColor);
    customHtml = customHtml.replace(/{{signerName}}/g, signerName);
    customHtml = customHtml.replace(/{{signerTitle}}/g, signerTitle);
    customHtml = customHtml.replace(/{{verificationUrl}}/g, verificationUrl);
    
    // Collaborator placeholders (clean URL inside src="")
    customHtml = customHtml.replace(/{{collaboratingOrgNames}}/g, data.collabOrgNames);
    customHtml = customHtml.replace(/{{collabOrgName}}/g, data.collabOrgNames);
    customHtml = customHtml.replace(/src=["']{{collabOrgLogo}}["']/g, `src="${data.primaryCollabLogo}"`);
    customHtml = customHtml.replace(/src=["']{{collaboratingOrgLogos}}["']/g, `src="${data.primaryCollabLogo}"`);
    customHtml = customHtml.replace(/src=["']{{collabOrgLogoUrl}}["']/g, `src="${data.primaryCollabLogo}"`);
    customHtml = customHtml.replace(/{{collabOrgLogoUrl}}/g, data.primaryCollabLogo);
    customHtml = customHtml.replace(/{{collabOrgLogo}}/g, data.primaryCollabLogo);
    customHtml = customHtml.replace(/{{collaboratingOrgLogos}}/g, data.primaryCollabLogo ? `<img src="${data.primaryCollabLogo}" alt="" style="max-height: 44px; max-width: 140px; object-fit: contain;" />` : '');
    
    customHtml = customHtml.replace(/{{qrCodeDataUrl}}/g, data.qrUrl);
    return customHtml;
  }

  // Official Standard RBF Certificate Template (Exact Image 1 Layout)
  return `
    <div style="width: 880px; margin: 0 auto; background: #ffffff; color: #0f172a; font-family: 'Georgia', 'Times New Roman', serif; box-sizing: border-box; padding: 12px;">
      <div style="border: 3px solid ${primaryColor}; padding: 36px 44px; background: #ffffff; box-sizing: border-box;">
        <div style="border: 1px solid ${secondaryColor}; padding: 32px 36px; text-align: center; background: #ffffff; box-sizing: border-box;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="font-size: 26px; font-weight: bold; color: ${primaryColor}; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px 0;">
              Realbell Business Foundation
            </div>
            <div style="font-size: 13px; color: #64748b; letter-spacing: 1px; margin: 0 0 4px 0;">
              Certificate of Achievement
            </div>
            ${data.collabOrgNames ? `
              <div style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; margin-top: 6px; font-size: 12px; color: #475569; font-style: italic; font-family: sans-serif;">
                <span>in joint collaboration with <strong>${data.collabOrgNames}</strong></span>
                ${data.primaryCollabLogo ? `<img src="${data.primaryCollabLogo}" alt="" style="max-height: 34px; max-width: 100px; object-fit: contain; vertical-align: middle;" />` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Body -->
          <div style="margin: 22px 0;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px 0;">
              This is to certify that
            </div>
            <div style="font-size: 32px; font-weight: bold; color: #0f172a; margin: 8px 0 12px 0; border-bottom: 2px solid ${secondaryColor}; display: inline-block; padding-bottom: 4px; min-width: 260px;">
              ${data.candidateName}
            </div>
            <div style="font-size: 14px; color: #334155; line-height: 1.6; max-width: 620px; margin: 14px auto; font-family: 'Georgia', serif;">
              has successfully completed the assessment <strong>${data.testTitle}</strong> in the domain of <strong>${data.domain}</strong> with a score of <strong>${data.score}</strong> marks (${data.score}%).
            </div>
          </div>

          <!-- 3 Columns -->
          <div style="display: flex; justify-content: space-between; margin: 25px 0; font-size: 11px; color: #64748b; font-family: monospace; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 16px;">
            <div>
              <div style="text-transform: uppercase; font-size: 10px; color: #64748b;">Certificate ID</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 3px;">${data.certId}</div>
            </div>
            <div>
              <div style="text-transform: uppercase; font-size: 10px; color: #64748b;">Issue Date</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 3px;">${data.issueDate}</div>
            </div>
            <div>
              <div style="text-transform: uppercase; font-size: 10px; color: #64748b;">Registration ID</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 3px;">${data.regId}</div>
            </div>
          </div>

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <div>
              <img src="${data.qrUrl}" alt="" style="width: 85px; height: 85px; border: 1px solid #e2e8f0; padding: 2px; display: block;" />
            </div>
            <div style="text-align: center;">
              <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${signerName}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${signerTitle}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b; font-family: monospace;">
              <div>Verify at: ${verificationUrl}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Directly downloads the Official Certificate Template as a PDF file (without opening print dialog)
 * Converts all images to local Base64 data URLs to prevent CORS block / alt text display.
 */
export async function downloadCertificatePDF(cert) {
  const data = getNormalizedCertificateData(cert);
  const htmlContent = buildOfficialTemplateHTML(data, cert);

  // 1. Create a dedicated container for rendering the official template
  const container = document.createElement('div');
  container.id = 'rbf-official-certificate-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '880px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '9999999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // 2. Convert EVERY <img> src inside the container into an inline Base64 Data URL
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      let rawSrc = img.getAttribute('src');
      if (rawSrc && rawSrc.startsWith('/')) {
        rawSrc = `${window.location.origin}${rawSrc}`;
      }
      if (rawSrc && !rawSrc.startsWith('data:image')) {
        const base64Src = await convertImageUrlToBase64(rawSrc);
        if (base64Src && base64Src.startsWith('data:image')) {
          img.setAttribute('src', base64Src);
        }
      }
      
      // Remove alt attribute during export so no fallback text is ever drawn by html2canvas
      img.removeAttribute('alt');
      
      // Wait for image to be fully loaded and decoded
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      if (img.decode) {
        try {
          await img.decode();
        } catch (decodeErr) {
          // ignore
        }
      }
    })
  );

  // Brief pause for browser rasterization
  await new Promise((resolve) => setTimeout(resolve, 250));

  try {
    // 3. Capture the rendered official template container into a high-res canvas
    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
      imageTimeout: 15000
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 4. Create A4 landscape jsPDF and add the captured official certificate
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale image to fit within A4 landscape margins
    const margin = 8;
    const availWidth = pdfWidth - (margin * 2);
    const availHeight = pdfHeight - (margin * 2);

    const imgRatio = canvas.width / canvas.height;
    let renderWidth = availWidth;
    let renderHeight = availWidth / imgRatio;

    if (renderHeight > availHeight) {
      renderHeight = availHeight;
      renderWidth = availHeight * imgRatio;
    }

    const posX = margin + (availWidth - renderWidth) / 2;
    const posY = margin + (availHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);

    // 5. Download the PDF directly to the user's disk
    pdf.save(`RBF_Certificate_${data.certId}.pdf`);
  } catch (err) {
    console.error('Error rendering official template PDF:', err);
  } finally {
    // Clean up temporary export container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Print helper
 */
export function printCertificateDocument(cert) {
  downloadCertificatePDF(cert);
}
