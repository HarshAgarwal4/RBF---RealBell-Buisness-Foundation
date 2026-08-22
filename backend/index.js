import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import mongoose from 'mongoose';
import { createServer } from "http";
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
import { seedDefaultRoles } from './App/controllers/roleController.js';
import { seedDefaultPlans } from './App/controllers/planController.js';
import { seedDefaultTeams } from './App/controllers/teamController.js';
import { registerSocketServer } from './services/socket.js';
import { clearRedis } from './services/Redis.js';
import LiveSessionModel from './App/models/liveSession.js';

const app = express();
const server = createServer(app);

app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json());
app.use(isLoggedIn)

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

app.use((err, req, res, next) => {
    if (!err) {
        return next();
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
    LiveSessionModel.syncIndexes().catch((err) => {
        console.warn("LiveSessionModel syncIndexes warning:", err.message);
    });
    server.listen(process.env.PORT, () => {
        console.log("Server is running on port", process.env.PORT);
    })
})

