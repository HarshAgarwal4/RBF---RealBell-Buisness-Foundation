import express from "express";
import {
  getLiveSessions,
  getLiveSessionById,
  createLiveSession,
  deleteLiveSession,
  joinQueue,
  leaveQueue,
  admitParticipant,
  endConsultation,
  togglePauseQueue,
} from "../controllers/liveSessionController.js";

const liveSessionRouter = express.Router();

liveSessionRouter.get("/", getLiveSessions);
liveSessionRouter.get("/:id", getLiveSessionById);
liveSessionRouter.post("/", createLiveSession);
liveSessionRouter.delete("/:id", deleteLiveSession);
liveSessionRouter.post("/:id/join-queue", joinQueue);
liveSessionRouter.post("/:id/leave-queue", leaveQueue);
liveSessionRouter.post("/:id/admit", admitParticipant);
liveSessionRouter.post("/:id/end-consultation", endConsultation);
liveSessionRouter.post("/:id/pause-queue", togglePauseQueue);

export default liveSessionRouter;
