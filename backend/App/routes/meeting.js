import express from "express";
import {
  getSchedulableConnections,
  createMeeting,
  getMyMeetings,
  getMeetingRequests,
  respondToMeeting,
  cancelMeeting,
} from "../controllers/meeting.js";

const meetingRouter = express.Router();

meetingRouter.get("/connections", getSchedulableConnections); // dropdown data (accepted connections only)
meetingRouter.post("/", createMeeting); // schedule a new meeting
meetingRouter.get("/", getMyMeetings); // all of my meetings
meetingRouter.get("/requests", getMeetingRequests); // pending requests I received
meetingRouter.patch("/:id/respond", respondToMeeting); // accept / decline
meetingRouter.delete("/:id", cancelMeeting); // cancel (organizer only)

export default meetingRouter;