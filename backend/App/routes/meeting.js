import express from "express";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import {
  getSchedulableConnections,
  createMeeting,
  getMyMeetings,
  getMeetingRequests,
  respondToMeeting,
  cancelMeeting,
} from "../controllers/meeting.js";

const meetingRouter = express.Router();

meetingRouter.get("/connections", requireSubscription("meetings"), getSchedulableConnections);
meetingRouter.post("/", requireSubscription("meetings"), createMeeting);
meetingRouter.get("/", requireSubscription("meetings"), getMyMeetings);
meetingRouter.get("/requests", requireSubscription("meetings"), getMeetingRequests);
meetingRouter.patch("/:id/respond", requireSubscription("meetings"), respondToMeeting);
meetingRouter.delete("/:id", requireSubscription("meetings"), cancelMeeting);

export default meetingRouter;