import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import { createUploadMiddleware } from "../../services/upload.js";
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

/* ── Public (any logged-in user) ── */
resourceRouter.get("/", getResources);
resourceRouter.patch("/:id/download", incrementDownload);

/* ── Admin only with RBAC ── */
resourceRouter.post(
  "/",
  isAdmin,
  authorize("resources.create"),
  resourceUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  createResource
);

resourceRouter.put(
  "/:id",
  isAdmin,
  authorize("resources.update"),
  resourceUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateResource
);

resourceRouter.delete("/:id", isAdmin, authorize("resources.delete"), deleteResource);

export default resourceRouter;
