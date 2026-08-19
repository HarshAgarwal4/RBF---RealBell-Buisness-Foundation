import express from "express";
import {
  createLiveSession,
  getLiveSessions,
  getMyLiveSessions,
  getLiveSessionById,
  deleteLiveSession,
  verifySessionPasscode,
  getLiveSessionConnections,
  inviteConnectionsToSession,
  startLiveSession,
  pauseLiveSession,
  resumeLiveSession,
  endLiveSession,
  joinSessionQueue,
  leaveSessionQueue,
  getSessionQueue,
  admitParticipantController,
  rejectParticipantController,
  endConsultationController,
  nextParticipantController,
  toggleQueuePauseController,
  getCallAccessGrant,
  getSessionAnalyticsController,
} from "../controllers/liveSessionController.js";

const liveSessionRouter = express.Router();

// Session CRUD, Lists & Connections
liveSessionRouter.post("/", createLiveSession);
liveSessionRouter.get("/", getLiveSessions);
liveSessionRouter.get("/my-sessions", getMyLiveSessions);
liveSessionRouter.get("/connections", getLiveSessionConnections);
liveSessionRouter.get("/:id", getLiveSessionById);
liveSessionRouter.delete("/:id", deleteLiveSession);
liveSessionRouter.post("/:id/verify-passcode", verifySessionPasscode);
liveSessionRouter.post("/:id/invite", inviteConnectionsToSession);

// Host Lifecycle Controls
liveSessionRouter.patch("/:id/start", startLiveSession);
liveSessionRouter.patch("/:id/pause", pauseLiveSession);
liveSessionRouter.patch("/:id/resume", resumeLiveSession);
liveSessionRouter.patch("/:id/end", endLiveSession);

// Participant Queue Interactions
liveSessionRouter.post("/:id/queue", joinSessionQueue);
liveSessionRouter.delete("/:id/queue", leaveSessionQueue);
liveSessionRouter.get("/:id/queue", getSessionQueue);

// Host Queue Controls
liveSessionRouter.post("/:id/queue/:entryId/admit", admitParticipantController);
liveSessionRouter.post("/:id/queue/:entryId/reject", rejectParticipantController);
liveSessionRouter.post("/:id/consultation/end", endConsultationController);
liveSessionRouter.post("/:id/next", nextParticipantController);
liveSessionRouter.patch("/:id/queue-pause", toggleQueuePauseController);

// Video Room Call Access Guard
liveSessionRouter.get("/:id/call-access", getCallAccessGrant);

// Analytics
liveSessionRouter.get("/:id/analytics", getSessionAnalyticsController);

export default liveSessionRouter;
