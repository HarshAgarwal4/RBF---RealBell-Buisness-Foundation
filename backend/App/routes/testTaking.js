import { Router } from 'express';
import * as ctrl from '../controllers/testTakingController.js';

const router = Router();

router.get('/available', ctrl.getAvailableTests);
router.get('/my-attempts', ctrl.getMyAttempts);
router.get('/my-certificates', ctrl.getMyCertificates);
router.get('/certificates/:id/download', ctrl.downloadCertificate);
router.get('/:id', ctrl.getTestDetails);
router.post('/:id/start', ctrl.startTest);
router.post('/attempts/:id/answer', ctrl.submitAnswer);
router.post('/attempts/:id/submit', ctrl.submitTest);
router.get('/attempts/:id', ctrl.getAttemptStatus);

export default router;
