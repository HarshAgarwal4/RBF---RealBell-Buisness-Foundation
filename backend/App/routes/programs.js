import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
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
programsRouter.post("/apply/:id", applyToProgram);
programsRouter.get("/my-applications", getMyApplications);

/* ── Admin Routes ── */
programsRouter.get("/admin", isAdmin, getAllProgramsAdmin);
programsRouter.post("/admin/ai-generate", isAdmin, generateAIContent);
programsRouter.get("/admin/:id", isAdmin, getProgramByIdAdmin);
programsRouter.post(
  "/admin",
  isAdmin,
  programUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  createProgram
);
programsRouter.put(
  "/admin/:id",
  isAdmin,
  programUpload.fields([
    { name: "banner_image", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  updateProgram
);
programsRouter.delete("/admin/:id", isAdmin, deleteProgram);
programsRouter.get("/admin/:id/applications", isAdmin, getAllApplications);
programsRouter.patch(
  "/admin/applications/:appId/status",
  isAdmin,
  updateApplicationStatus
);

export default programsRouter;
