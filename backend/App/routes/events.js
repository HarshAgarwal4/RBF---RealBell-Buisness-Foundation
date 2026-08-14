import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
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
eventsRouter.post("/register/:id", registerForEvent);
eventsRouter.get("/my-registrations", getMyEventRegistrations);

/* ── Admin Routes (Admin & Super Admin) ── */
eventsRouter.get("/admin", isAdmin, getAllEventsAdmin);
eventsRouter.post("/admin/ai-generate", isAdmin, generateEventAIContent);
eventsRouter.get("/admin/:id", isAdmin, getEventByIdAdmin);
eventsRouter.post(
  "/admin",
  isAdmin,
  eventUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createEvent
);
eventsRouter.put(
  "/admin/:id",
  isAdmin,
  eventUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  updateEvent
);
eventsRouter.delete("/admin/:id", isAdmin, deleteEvent);
eventsRouter.get("/admin/:id/attendees", isAdmin, getEventAttendees);

export default eventsRouter;
