import express from "express";
import {
  getMyNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from "../controllers/communicationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/my", getMyNotifications);
notificationRouter.get("/:id", getNotificationById);
notificationRouter.patch("/:id/read", markNotificationRead);
notificationRouter.patch("/read-all", markAllNotificationsRead);
notificationRouter.delete("/:id/dismiss", dismissNotification);
notificationRouter.delete("/:id", dismissNotification);

export default notificationRouter;

