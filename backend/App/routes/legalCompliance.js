import express from "express";
import { isAdmin, isSuperAdmin, authorize } from "../../middlewares/admin.js";
import { createUploadMiddleware } from "../../services/upload.js";
import {
  getAllServicesAdmin,
  getServiceByIdAdmin,
  createService,
  updateService,
  deleteService,
  getActiveServices,
  getServiceById,
  createApplication,
  createApplicationPaymentOrder,
  verifyApplicationPayment,
  getMyApplications,
  getMyApplicationById,
  getMyComplianceDocuments,
  uploadAdditionalDocuments,
  getAllApplicationsAdmin,
  getApplicationByIdAdmin,
  updateApplicationStatus,
  uploadFinalDocuments,
} from "../controllers/legalComplianceController.js";

const legalComplianceRouter = express.Router();

// Multer upload middleware: allow documents (PDFs, Images, Docs) up to 25MB
const complianceUpload = createUploadMiddleware({
  maxFileSize: 25 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
});

/* ─────────────────────────────────────────────────────────────
   USER PUBLIC / DISCOVERY ROUTES
───────────────────────────────────────────────────────────── */
legalComplianceRouter.get("/services/active", getActiveServices);
legalComplianceRouter.get("/services/detail/:id", getServiceById);

/* ─────────────────────────────────────────────────────────────
   USER APPLICATION ROUTES
───────────────────────────────────────────────────────────── */
legalComplianceRouter.post("/applications", complianceUpload.any(), createApplication);
legalComplianceRouter.get("/applications/my", getMyApplications);
legalComplianceRouter.get("/applications/my/:id", getMyApplicationById);
legalComplianceRouter.get("/documents/my", getMyComplianceDocuments);
legalComplianceRouter.post(
  "/applications/:id/upload-additional",
  complianceUpload.any(),
  uploadAdditionalDocuments
);

/* ─────────────────────────────────────────────────────────────
   PAYMENT ROUTES
───────────────────────────────────────────────────────────── */
legalComplianceRouter.post("/applications/payment/order", createApplicationPaymentOrder);
legalComplianceRouter.post("/applications/payment/verify", verifyApplicationPayment);

/* ─────────────────────────────────────────────────────────────
   ADMIN & SUPER ADMIN ROUTES WITH RBAC
───────────────────────────────────────────────────────────── */
// Services Management
legalComplianceRouter.get("/admin/services", isAdmin, authorize("legal_compliance.view"), getAllServicesAdmin);
legalComplianceRouter.get("/admin/services/:id", isAdmin, authorize("legal_compliance.view"), getServiceByIdAdmin);
legalComplianceRouter.post("/admin/services", isAdmin, authorize("legal_compliance.manage"), createService);
legalComplianceRouter.put("/admin/services/:id", isAdmin, authorize("legal_compliance.manage"), updateService);
legalComplianceRouter.delete("/admin/services/:id", isSuperAdmin, deleteService);

// Applications Management
legalComplianceRouter.get("/admin/applications", isAdmin, authorize("legal_compliance.view"), getAllApplicationsAdmin);
legalComplianceRouter.get("/admin/applications/:id", isAdmin, authorize("legal_compliance.view"), getApplicationByIdAdmin);
legalComplianceRouter.put("/admin/applications/:id/status", isAdmin, authorize("legal_compliance.manage"), updateApplicationStatus);
legalComplianceRouter.post(
  "/admin/applications/:id/final-documents",
  isAdmin,
  authorize("legal_compliance.manage"),
  complianceUpload.any(),
  uploadFinalDocuments
);

export { legalComplianceRouter };
export default legalComplianceRouter;
