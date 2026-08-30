import { Router } from 'express';
import { requireSubscription } from '../../middlewares/subscriptionGuard.js';
import * as ctrl from '../controllers/testTakingController.js';

const router = Router();

router.get('/available', ctrl.getAvailableTests);
router.get('/my-attempts', requireSubscription("assessments"), ctrl.getMyAttempts);
router.get('/my-certificates', requireSubscription("certificates"), ctrl.getMyCertificates);
router.get('/certificates/:id/download', requireSubscription("certificates"), ctrl.downloadCertificate);
router.get('/:id', ctrl.getTestDetails);
router.post('/:id/start', requireSubscription("assessments"), ctrl.startTest);
router.post('/attempts/:id/answer', requireSubscription("assessments"), ctrl.submitAnswer);
router.post('/attempts/:id/submit', requireSubscription("assessments"), ctrl.submitTest);
router.get('/attempts/:id', requireSubscription("assessments"), ctrl.getAttemptStatus);

export default router;
