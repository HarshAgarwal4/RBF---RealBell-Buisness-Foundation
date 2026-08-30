import express from "express";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
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
liveSessionRouter.post("/", requireSubscription("live_sessions"), createLiveSession);
liveSessionRouter.delete("/:id", requireSubscription("live_sessions"), deleteLiveSession);
liveSessionRouter.post("/:id/join-queue", requireSubscription("live_sessions"), joinQueue);
liveSessionRouter.post("/:id/leave-queue", requireSubscription("live_sessions"), leaveQueue);
liveSessionRouter.post("/:id/admit", requireSubscription("live_sessions"), admitParticipant);
liveSessionRouter.post("/:id/end-consultation", requireSubscription("live_sessions"), endConsultation);
liveSessionRouter.post("/:id/pause-queue", requireSubscription("live_sessions"), togglePauseQueue);

export default liveSessionRouter;
