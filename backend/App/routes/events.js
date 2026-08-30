import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import { createUploadMiddleware } from "../../services/upload.js";
import {
  getAllEventsPublic,
  getEventByIdPublic,
  registerForEvent,
  getMyEventRegistrations,
  getAllEventsAdmin,
  getEventByIdAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  generateEventAIContent,
  getEventAttendees,
} from "../controllers/events.js";

const eventsRouter = express.Router();

/* ── Multer: banner + logo images up to 5 MB ── */
const eventUpload = createUploadMiddleware({
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

/* ── Public / User Routes ── */
eventsRouter.get("/public", getAllEventsPublic);
eventsRouter.get("/public/:id", getEventByIdPublic);
eventsRouter.post("/register/:id", requireSubscription("events"), registerForEvent);
eventsRouter.get("/my-registrations", requireSubscription("events"), getMyEventRegistrations);

/* ── Admin Routes (Admin & Super Admin) ── */
eventsRouter.get("/admin", isAdmin, authorize("events.view"), getAllEventsAdmin);
eventsRouter.post("/admin/ai-generate", isAdmin, authorize("events.create"), generateEventAIContent);
eventsRouter.get("/admin/:id", isAdmin, authorize("events.view"), getEventByIdAdmin);
eventsRouter.post(
  "/admin",
  isAdmin,
  authorize("events.create"),
  eventUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createEvent
);
eventsRouter.put(
  "/admin/:id",
  isAdmin,
  authorize("events.update"),
  eventUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  updateEvent
);
eventsRouter.delete("/admin/:id", isAdmin, authorize("events.delete"), deleteEvent);
eventsRouter.get("/admin/:id/attendees", isAdmin, authorize("events.attendees_view"), getEventAttendees);

export default eventsRouter;
