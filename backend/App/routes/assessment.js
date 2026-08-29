import { Router } from 'express';
import { authorize } from '../../middlewares/rbac.js';
import { createUploadMiddleware } from '../../services/upload.js';
import * as ctrl from '../controllers/assessmentController.js';

const router = Router();
const logoUpload = createUploadMiddleware({ maxFileSize: 2 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] });

// Domain routes
router.post('/domains', authorize('assessments.create'), ctrl.createDomain);
router.get('/domains', authorize('assessments.view'), ctrl.getDomains);
router.put('/domains/:id', authorize('assessments.update'), ctrl.updateDomain);
router.delete('/domains/:id', authorize('assessments.delete'), ctrl.deleteDomain);

// Question routes
router.post('/questions', authorize('assessments.create'), ctrl.createQuestion);
router.get('/questions', authorize('assessments.view'), ctrl.getQuestions);
router.get('/questions/:id', authorize('assessments.view'), ctrl.getQuestion);
router.put('/questions/:id', authorize('assessments.update'), ctrl.updateQuestion);
router.delete('/questions/:id', authorize('assessments.delete'), ctrl.deleteQuestion);
router.post('/questions/:id/duplicate', authorize('assessments.create'), ctrl.duplicateQuestion);

// Question Bank routes
router.post('/question-banks', authorize('assessments.create'), ctrl.createQuestionBank);
router.get('/question-banks', authorize('assessments.view'), ctrl.getQuestionBanks);
router.put('/question-banks/:id', authorize('assessments.update'), ctrl.updateQuestionBank);
router.delete('/question-banks/:id', authorize('assessments.delete'), ctrl.deleteQuestionBank);

// Test routes
router.post('/tests', authorize('assessments.create'), ctrl.createTest);
router.get('/tests', authorize('assessments.view'), ctrl.getTests);
router.get('/tests/:id', authorize('assessments.view'), ctrl.getTest);
router.put('/tests/:id', authorize('assessments.update'), ctrl.updateTest);
router.delete('/tests/:id', authorize('assessments.delete'), ctrl.deleteTest);
router.put('/tests/:id/publish', authorize('assessments.update'), ctrl.publishTest);
router.put('/tests/:id/unpublish', authorize('assessments.update'), ctrl.unpublishTest);
router.put('/tests/:id/archive', authorize('assessments.update'), ctrl.archiveTest);

// Collaborator routes
router.post('/collaborators', authorize('assessments.create'), logoUpload.single('logo'), ctrl.createCollaborator);
router.get('/collaborators', authorize('assessments.view'), ctrl.getCollaborators);
router.put('/collaborators/:id', authorize('assessments.update'), logoUpload.single('logo'), ctrl.updateCollaborator);
router.delete('/collaborators/:id', authorize('assessments.delete'), ctrl.deleteCollaborator);

// Attempt management
router.get('/tests/:id/attempts', authorize('assessments.view'), ctrl.getTestAttempts);
router.get('/attempts/:id', authorize('assessments.view'), ctrl.getAttemptDetail);
router.put('/attempts/:id/evaluate', authorize('assessments.evaluate'), ctrl.evaluateTextAnswerHandler);

// Analytics
router.get('/analytics', authorize('assessments.view'), ctrl.getAnalytics);

export default router;
