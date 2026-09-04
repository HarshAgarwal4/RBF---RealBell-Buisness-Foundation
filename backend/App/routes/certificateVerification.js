import { Router } from 'express';
import { authorize } from '../../middlewares/rbac.js';
import { uploadLimiter } from '../../middlewares/rateLimiter.js';
import * as ctrl from '../controllers/certificateController.js';

const router = Router();

// PUBLIC - Certificate verification & Image proxy (no auth needed)
router.get('/verify/:certificateId', ctrl.verifyCertificate);
router.post('/proxy-image', uploadLimiter, ctrl.proxyImage);

// Admin - Certificate management
router.get('/admin/all', authorize('certificates.view'), ctrl.getAllCertificates);
router.get('/admin/search', authorize('certificates.view'), ctrl.searchCertificates);
router.get('/admin/:id', authorize('certificates.view'), ctrl.getCertificateDetail);
router.put('/admin/:id/revoke', authorize('certificates.manage'), ctrl.revokeCertificate);
router.put('/admin/:id/restore', authorize('certificates.manage'), ctrl.restoreCertificate);
router.get('/admin/:id/audit', authorize('certificates.view'), ctrl.getCertificateAudit);

// Certificate templates & builder
router.post('/templates', authorize(['certificates.templates_manage', 'certificates.manage']), ctrl.createTemplate);
router.get('/templates', authorize(['certificates.templates_view', 'certificates.view']), ctrl.getTemplates);
router.put('/templates/:id', authorize(['certificates.templates_manage', 'certificates.manage']), ctrl.updateTemplate);
router.delete('/templates/:id', authorize(['certificates.templates_manage', 'certificates.manage']), ctrl.deleteTemplate);

export default router;
