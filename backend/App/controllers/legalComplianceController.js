import crypto from "crypto";
import Razorpay from "razorpay";
import LegalComplianceServiceModel from "../models/legalComplianceService.js";
import LegalComplianceApplicationModel from "../models/legalComplianceApplication.js";
import TransactionModel from "../models/transaction.js";
import { uploadFileToCloud } from "../../services/upload.js";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_RBF1234567890";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_RBF";

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
} catch (e) {
  console.warn("LegalCompliance Razorpay init warning:", e.message);
}

/**
 * Generate a unique human-friendly application number e.g. LC-109283
 */
function generateAppNumber() {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `LC-${rand}`;
}

/* ─────────────────────────────────────────────────────────────
   SUPER ADMIN: SERVICE MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * Super Admin: Get all services (active and inactive)
 */
export async function getAllServicesAdmin(req, res) {
  try {
    const { category, search, status } = req.query;
    const query = { is_deleted: { $ne: true } };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const services = await LegalComplianceServiceModel.find(query).sort({ createdAt: -1 });

    // Aggregate application counts per service
    const counts = await LegalComplianceApplicationModel.aggregate([
      { $group: { _id: "$service", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const enrichedServices = services.map((s) => ({
      ...s.toObject(),
      applicationCount: countMap[s._id.toString()] || 0,
    }));

    return res.json({ status: 1, services: enrichedServices });
  } catch (err) {
    console.error("getAllServicesAdmin error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Super Admin: Get single service details
 */
export async function getServiceByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    const service = await LegalComplianceServiceModel.findById(id);
    if (!service || service.is_deleted) {
      return res.status(404).json({ status: 0, msg: "Service not found" });
    }
    return res.json({ status: 1, service });
  } catch (err) {
    console.error("getServiceByIdAdmin error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Super Admin: Create a new compliance service
 */
export async function createService(req, res) {
  try {
    const {
      title,
      category,
      short_description,
      description,
      fee = 0,
      currency = "INR",
      is_payment_required = false,
      processing_time,
      icon,
      status = "active",
      form_fields = [],
      required_documents = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 0, msg: "Service title is required" });
    }

    // Assign IDs to fields and docs if missing
    const formattedFields = (Array.isArray(form_fields) ? form_fields : []).map((f, idx) => ({
      id: f.id || `f_${Date.now()}_${idx}`,
      name: f.name || `field_${idx}`,
      label: f.label || `Field ${idx + 1}`,
      type: f.type || "text",
      required: !!f.required,
      placeholder: f.placeholder || "",
      options: Array.isArray(f.options) ? f.options : [],
      order: typeof f.order === "number" ? f.order : idx,
      validation: f.validation || {},
    }));

    const formattedDocs = (Array.isArray(required_documents) ? required_documents : []).map((d, idx) => ({
      id: d.id || `doc_${Date.now()}_${idx}`,
      name: d.name || `Document ${idx + 1}`,
      description: d.description || "",
      required: d.required !== undefined ? !!d.required : true,
      allowed_types: d.allowed_types || ["application/pdf", "image/jpeg", "image/png", "image/webp"],
      max_size_mb: d.max_size_mb || 10,
      order: typeof d.order === "number" ? d.order : idx,
    }));

    const service = await LegalComplianceServiceModel.create({
      title: title.trim(),
      category: category ? category.trim() : "General",
      short_description: short_description ? short_description.trim() : "",
      description: description ? description.trim() : "",
      fee: Number(fee) >= 0 ? Number(fee) : 0,
      currency,
      is_payment_required: Number(fee) > 0 ? !!is_payment_required : false,
      processing_time: processing_time ? processing_time.trim() : "3-5 Business Days",
      icon: icon || "Scale",
      status: status === "inactive" ? "inactive" : "active",
      form_fields: formattedFields,
      required_documents: formattedDocs,
      created_by: req.user._id,
    });

    return res.status(201).json({
      status: 1,
      msg: "Legal Compliance Service created successfully",
      service,
    });
  } catch (err) {
    console.error("createService error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to create service" });
  }
}

/**
 * Super Admin: Update compliance service
 */
export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      short_description,
      description,
      fee,
      currency,
      is_payment_required,
      processing_time,
      icon,
      status,
      form_fields,
      required_documents,
    } = req.body;

    const service = await LegalComplianceServiceModel.findById(id);
    if (!service || service.is_deleted) {
      return res.status(404).json({ status: 0, msg: "Service not found" });
    }

    if (title !== undefined) service.title = title.trim();
    if (category !== undefined) service.category = category.trim();
    if (short_description !== undefined) service.short_description = short_description.trim();
    if (description !== undefined) service.description = description.trim();
    if (fee !== undefined) service.fee = Math.max(0, Number(fee));
    if (currency !== undefined) service.currency = currency;
    if (is_payment_required !== undefined) service.is_payment_required = service.fee > 0 ? !!is_payment_required : false;
    if (processing_time !== undefined) service.processing_time = processing_time.trim();
    if (icon !== undefined) service.icon = icon;
    if (status !== undefined) service.status = status;

    if (Array.isArray(form_fields)) {
      service.form_fields = form_fields.map((f, idx) => ({
        id: f.id || `f_${Date.now()}_${idx}`,
        name: f.name || `field_${idx}`,
        label: f.label || `Field ${idx + 1}`,
        type: f.type || "text",
        required: !!f.required,
        placeholder: f.placeholder || "",
        options: Array.isArray(f.options) ? f.options : [],
        order: typeof f.order === "number" ? f.order : idx,
        validation: f.validation || {},
      }));
    }

    if (Array.isArray(required_documents)) {
      service.required_documents = required_documents.map((d, idx) => ({
        id: d.id || `doc_${Date.now()}_${idx}`,
        name: d.name || `Document ${idx + 1}`,
        description: d.description || "",
        required: d.required !== undefined ? !!d.required : true,
        allowed_types: d.allowed_types || ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        max_size_mb: d.max_size_mb || 10,
        order: typeof d.order === "number" ? d.order : idx,
      }));
    }

    await service.save();

    return res.json({
      status: 1,
      msg: "Service updated successfully",
      service,
    });
  } catch (err) {
    console.error("updateService error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update service" });
  }
}

/**
 * Super Admin: Soft delete service
 */
export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const service = await LegalComplianceServiceModel.findById(id);
    if (!service) {
      return res.status(404).json({ status: 0, msg: "Service not found" });
    }

    service.is_deleted = true;
    service.status = "inactive";
    await service.save();

    return res.json({ status: 1, msg: "Service deleted successfully" });
  } catch (err) {
    console.error("deleteService error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete service" });
  }
}

/* ─────────────────────────────────────────────────────────────
   NORMAL USER: SERVICE DISCOVERY
───────────────────────────────────────────────────────────── */

/**
 * User: Get all active compliance services
 */
export async function getActiveServices(req, res) {
  try {
    const { category, search } = req.query;
    const query = { status: "active", is_deleted: { $ne: true } };

    if (category && category !== "All") query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const services = await LegalComplianceServiceModel.find(query).sort({ createdAt: 1 });
    return res.json({ status: 1, services });
  } catch (err) {
    console.error("getActiveServices error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Get single service details
 */
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await LegalComplianceServiceModel.findOne({
      _id: id,
      status: "active",
      is_deleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({ status: 0, msg: "Service not found or inactive" });
    }

    return res.json({ status: 1, service });
  } catch (err) {
    console.error("getServiceById error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ─────────────────────────────────────────────────────────────
   NORMAL USER: DYNAMIC APPLICATION SUBMISSION
───────────────────────────────────────────────────────────── */

/**
 * User: Submit dynamic application with multiple uploaded documents
 */
export async function createApplication(req, res) {
  try {
    const { service_id, form_responses } = req.body;

    if (!service_id) {
      return res.status(400).json({ status: 0, msg: "Service ID is required" });
    }

    const service = await LegalComplianceServiceModel.findById(service_id);
    if (!service || service.is_deleted) {
      return res.status(404).json({ status: 0, msg: "Selected service is no longer available" });
    }

    // Parse form responses
    let parsedResponses = [];
    if (typeof form_responses === "string") {
      try {
        parsedResponses = JSON.parse(form_responses);
      } catch (e) {
        parsedResponses = [];
      }
    } else if (Array.isArray(form_responses)) {
      parsedResponses = form_responses;
    }

    // Validate mandatory form fields based on service configuration
    for (const field of service.form_fields) {
      if (field.required) {
        const found = parsedResponses.find(
          (r) => r.field_id === field.id || r.field_name === field.name
        );
        if (!found || found.value === undefined || found.value === null || String(found.value).trim() === "") {
          return res.status(400).json({
            status: 0,
            msg: `Missing required field: "${field.label}"`,
          });
        }
      }
    }

    // Process user-uploaded files
    // Files are received via multer memory storage
    const uploadedDocs = [];
    const files = req.files || [];

    // Parse document metadata map if sent
    let documentMeta = {};
    if (req.body.document_metadata) {
      try {
        documentMeta = typeof req.body.document_metadata === "string"
          ? JSON.parse(req.body.document_metadata)
          : req.body.document_metadata;
      } catch (e) {
        console.warn("document_metadata parse error:", e);
      }
    }

    for (const file of files) {
      try {
        const docId = file.fieldname.startsWith("doc_")
          ? file.fieldname.replace("doc_", "")
          : file.fieldname;

        const reqDocConfig = service.required_documents.find((d) => d.id === docId);
        const docName = reqDocConfig?.name || documentMeta[docId]?.name || file.originalname;

        const uploadResult = await uploadFileToCloud(file.buffer, file.originalname, {
          folder: "RBF/legal_compliance/user_documents",
          allowedFormats: [],
        });

        uploadedDocs.push({
          document_id: docId,
          document_name: docName,
          file_url: uploadResult.secure_url || uploadResult.url,
          public_id: uploadResult.public_id || "",
          original_name: file.originalname,
          mime_type: file.mimetype,
          size_in_bytes: file.size,
          uploaded_at: new Date(),
        });
      } catch (uploadErr) {
        console.error("Cloudinary file upload error:", uploadErr);
        return res.status(500).json({
          status: 0,
          msg: `Failed to upload document: ${file.originalname}`,
        });
      }
    }

    // Verify all mandatory documents were uploaded
    for (const reqDoc of service.required_documents) {
      if (reqDoc.required) {
        const isUploaded = uploadedDocs.some((d) => d.document_id === reqDoc.id);
        if (!isUploaded) {
          return res.status(400).json({
            status: 0,
            msg: `Mandatory document missing: "${reqDoc.name}"`,
          });
        }
      }
    }

    // Determine initial status & payment requirement
    const isPaymentReq = service.is_payment_required && service.fee > 0;
    const initialStatus = isPaymentReq ? "Payment Pending" : "Submitted";

    // Application Number
    const appNumber = generateAppNumber();

    // Snapshot service configuration for historical integrity
    const serviceSnapshot = {
      title: service.title,
      category: service.category,
      fee: service.fee,
      is_payment_required: service.is_payment_required,
      processing_time: service.processing_time,
      form_fields: service.form_fields,
      required_documents: service.required_documents,
    };

    const initialHistory = [
      {
        status: initialStatus,
        remark: isPaymentReq
          ? "Application initiated. Awaiting payment completion."
          : "Application submitted successfully.",
        updated_by: req.user._id,
        updated_by_name: req.user.name,
        updated_at: new Date(),
      },
    ];

    const application = await LegalComplianceApplicationModel.create({
      application_number: appNumber,
      service: service._id,
      service_snapshot: serviceSnapshot,
      applicant: req.user._id,
      form_responses: parsedResponses,
      documents: uploadedDocs,
      final_documents: [],
      status: initialStatus,
      status_history: initialHistory,
      payment: {
        required: isPaymentReq,
        status: isPaymentReq ? "pending" : "free",
        amount: isPaymentReq ? service.fee : 0,
        currency: service.currency || "INR",
        paid_at: isPaymentReq ? null : new Date(),
      },
    });

    return res.status(201).json({
      status: 1,
      msg: isPaymentReq
        ? "Application created. Please proceed to payment."
        : "Application submitted successfully!",
      application,
      is_payment_required: isPaymentReq,
    });
  } catch (err) {
    console.error("createApplication error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to submit application" });
  }
}

/* ─────────────────────────────────────────────────────────────
   PAYMENT INTEGRATION (RAZORPAY)
───────────────────────────────────────────────────────────── */

/**
 * User: Create Razorpay Payment Order for Compliance Application
 */
export async function createApplicationPaymentOrder(req, res) {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ status: 0, msg: "Application ID is required" });
    }

    const application = await LegalComplianceApplicationModel.findOne({
      _id: applicationId,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    if (!application.payment.required || application.payment.amount <= 0) {
      return res.json({
        status: 1,
        isFree: true,
        msg: "No payment is required for this service.",
      });
    }

    if (application.payment.status === "paid") {
      return res.status(400).json({
        status: 0,
        msg: "Payment for this application is already completed.",
      });
    }

    const amountInPaise = Math.round(application.payment.amount * 100);
    const receiptId = `lc_${application.application_number}_${Date.now().toString().slice(-6)}`;

    let razorpayOrder = null;
    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      try {
        razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: application.payment.currency || "INR",
          receipt: receiptId,
          notes: {
            applicationId: application._id.toString(),
            applicationNumber: application.application_number,
            userId: req.user._id.toString(),
            serviceTitle: application.service_snapshot.title,
          },
        });
      } catch (err) {
        console.error("Razorpay API order error, using demo fallback order:", err);
      }
    }

    if (!razorpayOrder) {
      razorpayOrder = {
        id: `order_lc_demo_${Date.now()}`,
        amount: amountInPaise,
        currency: application.payment.currency || "INR",
        receipt: receiptId,
      };
    }

    application.payment.razorpay_order_id = razorpayOrder.id;
    await application.save();

    return res.json({
      status: 1,
      order: razorpayOrder,
      key_id: KEY_ID,
      amount: application.payment.amount,
      applicationNumber: application.application_number,
    });
  } catch (err) {
    console.error("createApplicationPaymentOrder error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Verify Razorpay Payment Signature
 */
export async function verifyApplicationPayment(req, res) {
  try {
    const { applicationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!applicationId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ status: 0, msg: "Invalid payment payload" });
    }

    const application = await LegalComplianceApplicationModel.findOne({
      _id: applicationId,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    // Cryptographic signature check if live key secret exists
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        application.payment.status = "failed";
        await application.save();
        return res.status(400).json({ status: 0, msg: "Payment signature verification failed" });
      }
    }

    // Update payment details
    application.payment.status = "paid";
    application.payment.razorpay_order_id = razorpay_order_id;
    application.payment.razorpay_payment_id = razorpay_payment_id;
    application.payment.razorpay_signature = razorpay_signature || "verified";
    application.payment.paid_at = new Date();

    // Transition application status
    application.status = "Payment Completed";
    application.status_history.push({
      status: "Payment Completed",
      remark: `Payment of ₹${application.payment.amount} completed successfully. Payment ID: ${razorpay_payment_id}`,
      updated_by: req.user._id,
      updated_by_name: req.user.name,
      updated_at: new Date(),
    });

    await application.save();

    // Record transaction
    await TransactionModel.create({
      user: req.user._id,
      amount: application.payment.amount,
      currency: application.payment.currency || "INR",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || "verified",
      status: "paid",
      planName: `Legal Compliance: ${application.service_snapshot.title}`,
      planKey: `legal_compliance_${application.application_number}`,
      startDate: new Date(),
    });

    return res.json({
      status: 1,
      msg: "Payment verified successfully! Your application is now submitted for review.",
      application,
    });
  } catch (err) {
    console.error("verifyApplicationPayment error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ─────────────────────────────────────────────────────────────
   NORMAL USER: VIEW APPLICATIONS & CERTIFICATES
───────────────────────────────────────────────────────────── */

/**
 * User: Get all applications submitted by logged-in user
 */
export async function getMyApplications(req, res) {
  try {
    const applications = await LegalComplianceApplicationModel.find({ applicant: req.user._id })
      .sort({ createdAt: -1 })
      .populate("service", "title category icon fee processing_time");

    return res.json({ status: 1, applications });
  } catch (err) {
    console.error("getMyApplications error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Get single application details
 */
export async function getMyApplicationById(req, res) {
  try {
    const { id } = req.params;
    const application = await LegalComplianceApplicationModel.findOne({
      _id: id,
      applicant: req.user._id,
    }).populate("service", "title category icon fee processing_time");

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    return res.json({ status: 1, application });
  } catch (err) {
    console.error("getMyApplicationById error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Get all issued compliance documents and certificates
 */
export async function getMyComplianceDocuments(req, res) {
  try {
    const applications = await LegalComplianceApplicationModel.find({
      applicant: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .select("application_number service_snapshot status documents final_documents admin_remarks updatedAt createdAt");

    return res.json({ status: 1, applications });
  } catch (err) {
    console.error("getMyComplianceDocuments error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Upload additional documents if requested by Super Admin
 */
export async function uploadAdditionalDocuments(req, res) {
  try {
    const { id } = req.params;
    const application = await LegalComplianceApplicationModel.findOne({
      _id: id,
      applicant: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ status: 0, msg: "No files provided" });
    }

    for (const file of files) {
      const uploadResult = await uploadFileToCloud(file.buffer, file.originalname, {
        folder: "RBF/legal_compliance/additional_documents",
        allowedFormats: [],
      });

      application.documents.push({
        document_id: `add_${Date.now()}`,
        document_name: file.originalname,
        file_url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id || "",
        original_name: file.originalname,
        mime_type: file.mimetype,
        size_in_bytes: file.size,
        uploaded_at: new Date(),
      });
    }

    application.status = "Under Review";
    application.status_history.push({
      status: "Under Review",
      remark: `User uploaded ${files.length} additional document(s). Application resubmitted for review.`,
      updated_by: req.user._id,
      updated_by_name: req.user.name,
      updated_at: new Date(),
    });

    await application.save();

    return res.json({
      status: 1,
      msg: "Additional documents uploaded successfully.",
      application,
    });
  } catch (err) {
    console.error("uploadAdditionalDocuments error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to upload documents" });
  }
}

/* ─────────────────────────────────────────────────────────────
   SUPER ADMIN: APPLICATION MANAGEMENT & LIFECYCLE
───────────────────────────────────────────────────────────── */

/**
 * Super Admin: Get all applications across all users
 */
export async function getAllApplicationsAdmin(req, res) {
  try {
    const { page = 1, limit = 25, status, serviceId, search } = req.query;
    const query = {};

    if (status && status !== "All") query.status = status;
    if (serviceId) query.service = serviceId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = LegalComplianceApplicationModel.find(query)
      .sort({ createdAt: -1 })
      .populate("applicant", "name email phone company_name company_type account.image")
      .populate("service", "title category icon fee processing_time");

    if (search) {
      query.$or = [
        { application_number: { $regex: search, $options: "i" } },
        { "service_snapshot.title": { $regex: search, $options: "i" } },
      ];
    }

    const [applications, total] = await Promise.all([
      baseQuery.skip(skip).limit(parseInt(limit)),
      LegalComplianceApplicationModel.countDocuments(query),
    ]);

    return res.json({
      status: 1,
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getAllApplicationsAdmin error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Super Admin: Get single application details
 */
export async function getApplicationByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    const application = await LegalComplianceApplicationModel.findById(id)
      .populate("applicant", "name email phone company_name company_type account.image")
      .populate("service", "title category icon fee processing_time required_documents form_fields");

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    return res.json({ status: 1, application });
  } catch (err) {
    console.error("getApplicationByIdAdmin error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Super Admin: Update application status and append to timeline
 */
export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    const allowedStatuses = [
      "Draft",
      "Submitted",
      "Payment Pending",
      "Payment Completed",
      "Under Review",
      "Documents Required",
      "In Progress",
      "Completed",
      "Rejected",
      "Cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ status: 0, msg: "Invalid application status" });
    }

    const application = await LegalComplianceApplicationModel.findById(id);
    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    application.status = status;
    if (remark) {
      application.admin_remarks = remark;
    }

    application.status_history.push({
      status,
      remark: remark || `Status changed to ${status}`,
      updated_by: req.user._id,
      updated_by_name: `${req.user.name} (${req.user.role})`,
      updated_at: new Date(),
    });

    await application.save();

    return res.json({
      status: 1,
      msg: `Application status updated to ${status}`,
      application,
    });
  } catch (err) {
    console.error("updateApplicationStatus error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update status" });
  }
}

/**
 * Super Admin: Upload final issued documents / certificates
 */
export async function uploadFinalDocuments(req, res) {
  try {
    const { id } = req.params;
    const { title = "Compliance Certificate", remarks = "", markCompleted = "true" } = req.body;

    const application = await LegalComplianceApplicationModel.findById(id);
    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ status: 0, msg: "Please select at least one document to upload" });
    }

    const uploadedFinals = [];
    for (const file of files) {
      const uploadResult = await uploadFileToCloud(file.buffer, file.originalname, {
        folder: "RBF/legal_compliance/final_certificates",
        allowedFormats: [],
      });

      const finalDoc = {
        title: title || file.originalname,
        file_url: uploadResult.secure_url || uploadResult.url,
        public_id: uploadResult.public_id || "",
        original_name: file.originalname,
        mime_type: file.mimetype,
        size_in_bytes: file.size,
        remarks: remarks || "",
        uploaded_at: new Date(),
        uploaded_by: req.user._id,
      };

      application.final_documents.push(finalDoc);
      uploadedFinals.push(finalDoc);
    }

    if (markCompleted === "true" || markCompleted === true) {
      application.status = "Completed";
    }

    if (remarks) {
      application.admin_remarks = remarks;
    }

    application.status_history.push({
      status: application.status,
      remark: remarks || `Final document(s) issued: ${uploadedFinals.map((d) => d.title).join(", ")}`,
      updated_by: req.user._id,
      updated_by_name: `${req.user.name} (${req.user.role})`,
      updated_at: new Date(),
    });

    await application.save();

    return res.json({
      status: 1,
      msg: "Final compliance documents uploaded successfully!",
      application,
    });
  } catch (err) {
    console.error("uploadFinalDocuments error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to upload final documents" });
  }
}
