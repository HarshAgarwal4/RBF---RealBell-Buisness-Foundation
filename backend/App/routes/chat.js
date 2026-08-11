import express from "express";
import {
  fetchThreads,
  fetchThreadMessages,
  sendTextMessage,
  sendAttachmentMessage,
  markThreadAsRead,
} from "../controllers/chat.js";
import { chatUpload } from "../../services/chat.js";

const chatRouter = express.Router();

chatRouter.get("/threads", fetchThreads);
chatRouter.get("/threads/:otherId/messages", fetchThreadMessages);
chatRouter.post("/messages/text", sendTextMessage);
chatRouter.post("/messages/attachment", chatUpload.single("file"), sendAttachmentMessage);
chatRouter.post("/threads/:otherId/read", markThreadAsRead);

export default chatRouter;

