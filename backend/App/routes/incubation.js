import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import multer from "multer";
import {
  getIncubationForm,
  getMyIncubationApplication,
  submitIncubationApplication,
  userReplyFeedback,
  getMentorsList,
  bookMentorSession,
  getMyMentorSessions,
  getInfrastructureList,
  bookInfrastructure,
  getMyBookings,
  cancelBooking,
  getFacilitySlotAvailability,
  getAdminInfrastructureBookings,
  userQrCheckIn,
  userQrCheckOut,
  getMyAttendanceLogs,
  getMyAccounting,
  payMonthlyDues,
  getAdminApplications,
  updateAdminApplicationStatus,
  sendAdminFeedbackMessage,
  getAdminIncubationSettings,
  saveAdminIncubationSettings,
  createAdminMentor,
  deleteAdminMentor,
  getAdminRegisteredMentors,
  assignMentorsToApplication,
  saveAdminIncubationForm,
  createAdminInfrastructure,
  updateAdminInfrastructure,
  deleteAdminInfrastructure,
  getAdminAttendance,
  getAdminAccounting,
} from "../controllers/incubationController.js";

const incubationRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

// ── USER ROUTES (Protected by global isLoggedIn middleware in index.js) ──
incubationRouter.get("/form", getIncubationForm);
incubationRouter.get("/my-application", getMyIncubationApplication);
incubationRouter.post("/apply", upload.any(), submitIncubationApplication);
incubationRouter.post("/feedback/reply", userReplyFeedback);

// Mentors
incubationRouter.get("/mentors", getMentorsList);
incubationRouter.post("/mentors/book", bookMentorSession);
incubationRouter.get("/my-mentor-sessions", getMyMentorSessions);

// Infrastructure
incubationRouter.get("/infrastructure", getInfrastructureList);
incubationRouter.get("/infrastructure/availability", getFacilitySlotAvailability);
incubationRouter.post("/infrastructure/book", bookInfrastructure);
incubationRouter.get("/my-bookings", getMyBookings);
incubationRouter.delete("/bookings/:id", cancelBooking);

// Attendance
incubationRouter.post("/attendance/check-in", userQrCheckIn);
incubationRouter.post("/attendance/check-out", userQrCheckOut);
incubationRouter.get("/attendance/my-logs", getMyAttendanceLogs);

// Accounting & Payment
incubationRouter.get("/accounting", getMyAccounting);
incubationRouter.post("/pay-monthly-dues", payMonthlyDues);

// ── ADMIN ROUTES (Protected by isAdmin & Team RBAC) ──
incubationRouter.get("/admin/form", isAdmin, authorize(["programs.view", "programs.update", "dashboard.view"]), getIncubationForm);
incubationRouter.put("/admin/form", isAdmin, authorize(["programs.update", "programs.create"]), saveAdminIncubationForm);

incubationRouter.get("/admin/settings", isAdmin, authorize(["programs.view", "programs.update"]), getAdminIncubationSettings);
incubationRouter.put("/admin/settings", isAdmin, authorize(["programs.update", "programs.create"]), saveAdminIncubationSettings);

incubationRouter.get("/admin/applications", isAdmin, authorize(["programs.applications_view", "programs.view"]), getAdminApplications);
incubationRouter.put("/admin/applications/:id/status", isAdmin, authorize(["programs.applications_view", "programs.update"]), updateAdminApplicationStatus);
incubationRouter.put("/admin/applications/:id/assign-mentors", isAdmin, authorize(["programs.applications_view", "programs.update"]), assignMentorsToApplication);
incubationRouter.post("/admin/applications/:id/feedback", isAdmin, authorize(["programs.applications_view", "programs.update"]), sendAdminFeedbackMessage);

incubationRouter.get("/admin/registered-mentors", isAdmin, authorize(["programs.view", "programs.applications_view"]), getAdminRegisteredMentors);
incubationRouter.post("/admin/mentors", isAdmin, authorize(["programs.create", "programs.update"]), createAdminMentor);
incubationRouter.delete("/admin/mentors/:id", isAdmin, authorize(["programs.delete"]), deleteAdminMentor);

incubationRouter.get("/admin/infrastructure", isAdmin, authorize(["programs.view"]), getInfrastructureList);
incubationRouter.get("/admin/infrastructure/bookings", isAdmin, authorize(["programs.view"]), getAdminInfrastructureBookings);
incubationRouter.post("/admin/infrastructure", isAdmin, authorize(["programs.create", "programs.update"]), createAdminInfrastructure);
incubationRouter.put("/admin/infrastructure/:id", isAdmin, authorize(["programs.update"]), updateAdminInfrastructure);
incubationRouter.delete("/admin/infrastructure/:id", isAdmin, authorize(["programs.delete"]), deleteAdminInfrastructure);

incubationRouter.get("/admin/attendance", isAdmin, authorize(["programs.view", "users.view"]), getAdminAttendance);
incubationRouter.get("/admin/accounting", isAdmin, authorize(["programs.view", "wallets.view"]), getAdminAccounting);

export default incubationRouter;
