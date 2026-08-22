import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/communicationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/my", getMyNotifications);
notificationRouter.patch("/:id/read", markNotificationRead);
notificationRouter.patch("/read-all", markAllNotificationsRead);

export default notificationRouter;
