import express from "express";
import { authorize } from "../../middlewares/rbac.js";
import { uploadFile } from "../../services/upload.js";
import { uploadLimiter } from "../../middlewares/rateLimiter.js";
import {
  getMyApprovalStatus,
  saveDraftSubmission,
  submitApprovalForm,
  uploadApprovalDocument,
  getApprovalForms,
  getApprovalFormById,
  saveApprovalForm,
  deleteApprovalForm,
  getApprovalApplications,
  getApplicationDetails,
  reviewApplication,
  getApprovalStats,
} from "../controllers/approvalController.js";

const approvalRouter = express.Router();

// User Onboarding & Approval Submission Endpoints
approvalRouter.get("/my-status", getMyApprovalStatus);
approvalRouter.post("/my-submission/draft", saveDraftSubmission);
approvalRouter.post("/my-submission/submit", submitApprovalForm);
approvalRouter.post(
  "/upload-document",
  uploadLimiter,
  uploadFile.single("file"),
  uploadApprovalDocument
);

// Super Admin / Reviewer Endpoints (Protected by RBAC)
approvalRouter.get(
  "/stats",
  authorize(["approvals.view", "approvals.review"]),
  getApprovalStats
);
approvalRouter.get(
  "/forms",
  authorize(["approvals.view", "approvals.manage_forms"]),
  getApprovalForms
);
approvalRouter.get(
  "/forms/:id",
  authorize(["approvals.view", "approvals.manage_forms"]),
  getApprovalFormById
);
approvalRouter.post(
  "/forms",
  authorize("approvals.manage_forms"),
  saveApprovalForm
);
approvalRouter.delete(
  "/forms/:id",
  authorize("approvals.manage_forms"),
  deleteApprovalForm
);
approvalRouter.get(
  "/applications",
  authorize("approvals.view"),
  getApprovalApplications
);
approvalRouter.get(
  "/applications/:id",
  authorize("approvals.view"),
  getApplicationDetails
);
approvalRouter.post(
  "/applications/:id/review",
  authorize("approvals.review"),
  reviewApplication
);

export default approvalRouter;
