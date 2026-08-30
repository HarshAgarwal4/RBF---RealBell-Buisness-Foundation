import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import { createUploadMiddleware } from "../../services/upload.js";
import {
  getAllProgramsPublic,
  getProgramByIdPublic,
  applyToProgram,
  getMyApplications,
  getAllProgramsAdmin,
  getProgramByIdAdmin,
  createProgram,
  updateProgram,
  deleteProgram,
  generateAIContent,
  getAllApplications,
  updateApplicationStatus,
} from "../controllers/programs.js";

const programsRouter = express.Router();

/* ── Multer: banner + logo images up to 5 MB ── */
const programUpload = createUploadMiddleware({
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

/* ── Public / User Routes ── */
programsRouter.get("/public", getAllProgramsPublic);
programsRouter.get("/public/:id", getProgramByIdPublic);
programsRouter.post("/apply/:id", requireSubscription("programs"), applyToProgram);
programsRouter.get("/my-applications", requireSubscription("programs"), getMyApplications);

/* ── Admin Routes ── */
programsRouter.get("/admin", isAdmin, authorize("programs.view"), getAllProgramsAdmin);
programsRouter.post("/admin/ai-generate", isAdmin, authorize("programs.create"), generateAIContent);
programsRouter.get("/admin/:id", isAdmin, authorize("programs.view"), getProgramByIdAdmin);
programsRouter.post(
  "/admin",
  isAdmin,
  authorize("programs.create"),
  programUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createProgram
);
programsRouter.put(
  "/admin/:id",
  isAdmin,
  authorize("programs.update"),
  programUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  updateProgram
);
programsRouter.delete("/admin/:id", isAdmin, authorize("programs.delete"), deleteProgram);
programsRouter.get("/admin/:id/applications", isAdmin, authorize("programs.applications_view"), getAllApplications);
programsRouter.patch(
  "/admin/applications/:appId/status",
  isAdmin,
  authorize("programs.applications_view"),
  updateApplicationStatus
);

export default programsRouter;
