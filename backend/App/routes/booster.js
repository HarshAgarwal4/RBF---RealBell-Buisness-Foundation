import express from "express";
import { authorize } from "../../middlewares/rbac.js";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import { createUploadMiddleware } from "../../services/upload.js";
import {
  getBoosterItems,
  getBoosterItemById,
  applyBoosterPerk,
  getMyBoosterApplications,
  getAdminBoosterItems,
  createAdminBoosterItem,
  updateAdminBoosterItem,
  deleteAdminBoosterItem,
  getAdminBoosterApplications,
  reviewAdminBoosterApplication,
} from "../controllers/boosterController.js";

const boosterRouter = express.Router();

const boosterUpload = createUploadMiddleware({
  maxFileSize: 50 * 1024 * 1024, // 50MB
});

/* ── User / Public Routes ── */
boosterRouter.get("/items", getBoosterItems);
boosterRouter.get("/public", getBoosterItems);
boosterRouter.get("/items/:id", getBoosterItemById);
boosterRouter.post("/items/:id/apply", requireSubscription("booster"), applyBoosterPerk);
boosterRouter.get("/my-applications", requireSubscription("booster"), getMyBoosterApplications);

/* ── Admin CRUD & Review Routes Protected by RBAC ── */
boosterRouter.get("/admin/all", authorize("booster.view"), getAdminBoosterItems);
boosterRouter.get("/admin/applications", authorize("booster.view"), getAdminBoosterApplications);
boosterRouter.post("/admin/create", authorize("booster.create"), boosterUpload.any(), createAdminBoosterItem);
boosterRouter.put("/admin/:id", authorize("booster.update"), boosterUpload.any(), updateAdminBoosterItem);
boosterRouter.delete("/admin/:id", authorize("booster.delete"), deleteAdminBoosterItem);
boosterRouter.patch("/admin/applications/:id/review", authorize("booster.review_claims"), reviewAdminBoosterApplication);

export default boosterRouter;
