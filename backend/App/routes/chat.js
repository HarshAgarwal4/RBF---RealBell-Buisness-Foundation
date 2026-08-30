import express from "express";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import {
  fetchThreads,
  fetchThreadMessages,
  sendTextMessage,
  sendAttachmentMessage,
  markThreadAsRead,
} from "../controllers/chat.js";
import { chatUpload } from "../../services/chat.js";

const chatRouter = express.Router();

chatRouter.get("/threads", requireSubscription("messages"), fetchThreads);
chatRouter.get("/threads/:otherId/messages", requireSubscription("messages"), fetchThreadMessages);
chatRouter.post("/messages/text", requireSubscription("messages"), sendTextMessage);
chatRouter.post("/messages/attachment", requireSubscription("messages"), chatUpload.single("file"), sendAttachmentMessage);
chatRouter.post("/threads/:otherId/read", requireSubscription("messages"), markThreadAsRead);

export default chatRouter;
