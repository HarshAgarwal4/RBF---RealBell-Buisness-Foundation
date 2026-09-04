import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import { createUploadMiddleware } from "../../services/upload.js";
import { uploadLimiter } from "../../middlewares/rateLimiter.js";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload,
} from "../controllers/resource.js";

const resourceRouter = express.Router();

/* ── Multer: accept PDF, images, doc formats up to 20 MB ── */
const resourceUpload = createUploadMiddleware({
  maxFileSize: 20 * 1024 * 1024,
  allowedMimeTypes: [
    // PDFs & Docs (contracts, reports)
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Images (news thumbnails)
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
});

/* ── Middleware: Strictly enforce that only Admin and Super Admin can perform CRUD ── */
function isStrictAdminOrSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
  }
  if (req.user.accountStatus === "disabled") {
    return res.status(403).json({ status: 0, msg: "Access Forbidden: Your account has been disabled" });
  }
  if (req.user.role === "admin" || req.user.role === "super_admin") {
    return next();
  }
  return res.status(403).json({
    status: 0,
    msg: "Forbidden: Only Admin and Super Admin can perform CRUD operations on resources.",
  });
}

/* ── Public (any logged-in user) ── */
resourceRouter.get("/", getResources);
resourceRouter.patch("/:id/download", incrementDownload);

/* ── Admin & Super Admin only for CRUD ── */
resourceRouter.post(
  "/",
  isStrictAdminOrSuperAdmin,
  uploadLimiter,
  resourceUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  createResource
);

resourceRouter.put(
  "/:id",
  isStrictAdminOrSuperAdmin,
  uploadLimiter,
  resourceUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateResource
);

resourceRouter.delete("/:id", isStrictAdminOrSuperAdmin, deleteResource);

export default resourceRouter;
