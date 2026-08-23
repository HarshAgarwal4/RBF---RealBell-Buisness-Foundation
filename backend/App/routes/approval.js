import express from "express";
import { authorize } from "../../middlewares/rbac.js";
import { uploadFile } from "../../services/upload.js";
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
  uploadFile.single("file"),
  uploadApprovalDocument
);

// Super Admin / Reviewer Endpoints
approvalRouter.get(
  "/stats",
  authorize(["teams.view", "users.view"]),
  getApprovalStats
);
approvalRouter.get(
  "/forms",
  authorize(["teams.view", "users.view"]),
  getApprovalForms
);
approvalRouter.get(
  "/forms/:id",
  authorize(["teams.view", "users.view"]),
  getApprovalFormById
);
approvalRouter.post(
  "/forms",
  authorize(["teams.view", "users.view"]),
  saveApprovalForm
);
approvalRouter.delete(
  "/forms/:id",
  authorize(["teams.view", "users.view"]),
  deleteApprovalForm
);
approvalRouter.get(
  "/applications",
  authorize(["teams.view", "users.view"]),
  getApprovalApplications
);
approvalRouter.get(
  "/applications/:id",
  authorize(["teams.view", "users.view"]),
  getApplicationDetails
);
approvalRouter.post(
  "/applications/:id/review",
  authorize(["teams.view", "users.view"]),
  reviewApplication
);

export default approvalRouter;
