// Native Node.js built-in .env loader (Node v20.6.0+)
try {
  process.loadEnvFile?.();
} catch (_) {}

import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import mongoose from 'mongoose';
import { createServer } from "http";
import { securityHeaders } from './middlewares/securityHeaders.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { getCsrfTokenHandler, verifyCsrfToken } from './middlewares/csrf.js';
import { isLoggedIn } from './middlewares/Auth.js';
import { organizationRoutes } from './App/routes/organization.js';
import { connectRoutes } from './App/routes/connect.js';
import { communityRoutes } from './App/routes/community.js';
import meetingRouter from './App/routes/meeting.js';
import milestoneRouter from './App/routes/milestone.js';
import jobsRoutes from './App/routes/job.js';
import ticketRoutes from './App/routes/ticket.js';
import chatRouter from './App/routes/chat.js';
import adminRouter from './App/routes/admin.js';
import resourceRouter from './App/routes/resource.js';
import programsRouter from './App/routes/programs.js';
import eventsRouter from './App/routes/events.js';
import roleRouter from './App/routes/role.js';
import planRouter from './App/routes/plan.js';
import paymentRouter from './App/routes/payment.js';
import legalComplianceRouter from './App/routes/legalCompliance.js';
import liveSessionRouter from './App/routes/liveSession.js';
import notificationRouter from './App/routes/notification.js';
import pageContentRouter from './App/routes/pageContent.js';
import approvalRouter from './App/routes/approval.js';
import assessmentRouter from './App/routes/assessment.js';
import testTakingRouter from './App/routes/testTaking.js';
import certificateRouter from './App/routes/certificateVerification.js';
import boosterRouter from './App/routes/booster.js';
import aiRouter from './App/routes/ai.js';
import walletRouter from './App/routes/wallet.js';
import referralRouter from './App/routes/referral.js';
import incubationRouter from './App/routes/incubation.js';
import { seedDefaultRoles } from './App/controllers/roleController.js';
import { seedDefaultPlans } from './App/controllers/planController.js';
import { seedDefaultTeams } from './App/controllers/teamController.js';
import { seedDefaultPages } from './App/controllers/frontendCustomizerController.js';
import { seedDefaultCertificateTemplates } from './App/controllers/certificateController.js';
import { seedDefaultAiConfig } from './App/AI/seedAiConfig.js';
import { seedMissingReferralCodes } from './App/controllers/referralController.js';
import { registerSocketServer } from './services/socket.js';
import { clearRedis } from './services/Redis.js';
import LiveSessionModel from './App/models/liveSession.js';

const app = express();
app.set('trust proxy', 1);
const server = createServer(app);

// 1. Defensive HTTP security headers
app.use(securityHeaders);

// 2. Cookie parser for session and CSRF cookies
app.use(cookieParser());

// 3. Strict CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token', 'X-Razorpay-Signature']
// 4. Global baseline rate limiter across all endpoints (300 req / 15 mins)
app.use(globalLimiter);

// 5. JSON body parser
app.use(express.json());

// 5. CSRF Handshake endpoint (GET /csrf-token)
app.get('/csrf-token', getCsrfTokenHandler);

// 6. Anti-CSRF verification for all state-mutating requests (POST, PUT, DELETE, PATCH)
app.use(verifyCsrfToken);

// 7. Session authentication & authorization middleware
app.use(isLoggedIn);

app.get('/', (req, res) => {
    res.send("Hello World");
})
app.use('/' , organizationRoutes)
app.use('/roles', roleRouter)
app.use('/plans', planRouter)
app.use('/payment', paymentRouter)
app.use('/connect', connectRoutes)
app.use('/community', communityRoutes)
app.use('/meetings' , meetingRouter)
app.use('/milestones' , milestoneRouter)
app.use('/jobs' , jobsRoutes)
app.use('/tickets' , ticketRoutes)
app.use('/chat', chatRouter)
app.use('/admin', adminRouter)
app.use('/resources', resourceRouter)
app.use('/programs', programsRouter)
app.use('/events', eventsRouter)
app.use('/legal-compliance', legalComplianceRouter)
app.use('/legal-compliances', legalComplianceRouter)
app.use('/live-sessions', liveSessionRouter)
app.use('/live_sessions', liveSessionRouter)
app.use('/notifications', notificationRouter)
app.use('/page-content', pageContentRouter)
app.use('/approvals', approvalRouter)
app.use('/assessments', assessmentRouter)
app.use('/tests', testTakingRouter)
app.use('/certificates', certificateRouter)
app.use('/booster', boosterRouter)
app.use('/ai', aiRouter)
app.use('/wallet', walletRouter)
app.use('/referrals', referralRouter)
app.use('/incubation', incubationRouter)

app.use((err, req, res, next) => {
    if (!err) {
        return next();
    }

    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            status: 403,
            code: 'EBADCSRFTOKEN',
            message: 'Invalid or missing CSRF token',
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'File size exceeds the allowed limit',
        });
    }

    if (typeof err.message === 'string' && err.message.startsWith('Unsupported file type:')) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: err.message || 'Unexpected server error',
    });
});

registerSocketServer(server, app);

mongoose.connect(process.env.DB_URL, {
    dbName: "RBF"
}).then(() => {
    console.log("Connected to MongoDB Atlas");
    seedDefaultRoles();
    seedDefaultPlans();
    seedDefaultTeams();
    seedDefaultPages();
    seedDefaultCertificateTemplates();
    seedDefaultAiConfig();
    seedMissingReferralCodes();
    LiveSessionModel.syncIndexes().catch((err) => {
        console.warn("LiveSessionModel syncIndexes warning:", err.message);
    });
    server.listen(process.env.PORT, () => {
        console.log("Server is running on port", process.env.PORT);
    })
})

