import mongoose from "mongoose";
import ApprovalFormModel from "../models/approvalForm.js";
import ApprovalSubmissionModel from "../models/approvalSubmission.js";
import OrganizationModel from "../models/organization.js";
import { uploadFileToCloud } from "../../services/upload.js";
import { sendMail } from "../../services/mail.js";

/**
 * Generate unique application ID (e.g., APP-2026-8392)
 */
function generateApplicationId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${randomSuffix}`;
}

/**
 * Built-in default approval form templates if admin hasn't created a custom one for that role
 */
function getBuiltInDefaultForm(organizationType = "startup", roleKey = "default") {
  const commonFields = [
    {
      id: "f_legal_name",
      key: "legal_entity_name",
      label: "Registered Legal Entity / Organization Name",
      type: "text",
      placeholder: "e.g. Acme Innovations Pvt Ltd",
      required: true,
      description: "Official legal entity name as per incorporation or registration records.",
      gridCols: 2,
      order: 1,
    },
    {
      id: "f_reg_number",
      key: "registration_number",
      label: "CIN / Registration / Tax ID Number",
      type: "text",
      placeholder: "e.g. U72900KA2024PTC123456",
      required: true,
      description: "Official government identification number.",
      gridCols: 2,
      order: 2,
    },
    {
      id: "f_primary_sector",
      key: "primary_sector",
      label: "Primary Industry Sector",
      type: "select",
      options: [
        "FinTech & BFSI",
        "HealthTech & Life Sciences",
        "DeepTech & AI/ML",
        "Enterprise SaaS",
        "CleanTech & Energy",
        "AgriTech",
        "EdTech",
        "Consumer & Retail",
        "Logistics & Supply Chain",
        "Other Emerging Sector",
      ],
      required: true,
      description: "Select the primary operating domain.",
      gridCols: 2,
      order: 3,
    },
    {
      id: "f_years_operating",
      key: "years_operating",
      label: "Years in Operation / Experience",
      type: "number",
      placeholder: "e.g. 2",
      required: true,
      validation: { min: 0, max: 100 },
      gridCols: 2,
      order: 4,
    },
    {
      id: "f_website_url",
      key: "website_url",
      label: "Official Website or Portfolio URL",
      type: "url",
      placeholder: "https://yourventure.com",
      required: false,
      gridCols: 2,
      order: 5,
    },
    {
      id: "f_headquarters_address",
      key: "headquarters_address",
      label: "Registered Office Address",
      type: "address",
      placeholder: "Full street address, City, State, PIN Code",
      required: true,
      gridCols: 2,
      order: 6,
    },
    {
      id: "f_executive_summary",
      key: "executive_summary",
      label: "Operational Overview & Objective Statement",
      type: "textarea",
      placeholder: "Describe your core operations, value proposition, and key objectives on the platform...",
      required: true,
      validation: { minLength: 30, maxLength: 2000 },
      gridCols: 2,
      order: 7,
    },
    {
      id: "f_id_proof",
      key: "identity_proof_doc",
      label: "Primary Authorized Representative ID Document",
      type: "file",
      required: true,
      description: "Upload Government ID (Passport, Aadhaar, Driver License, or Director ID).",
      validation: {
        allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
        maxFileSizeMB: 10,
      },
      gridCols: 2,
      order: 8,
    },
    {
      id: "f_incorporation_doc",
      key: "incorporation_certificate",
      label: "Certificate of Incorporation / Registration Proof",
      type: "file",
      required: true,
      description: "Official registration certificate or tax documentation.",
      validation: {
        allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
        maxFileSizeMB: 15,
      },
      gridCols: 2,
      order: 9,
    },
    {
      id: "f_terms_confirmation",
      key: "terms_confirmation",
      label: "I confirm that all information and documents provided are authentic and accurate.",
      type: "terms",
      required: true,
      description: "False representation may lead to immediate deactivation under Foundation Bylaws.",
      gridCols: 2,
      order: 10,
    },
  ];

  return {
    _id: "default_fallback_form",
    organizationType,
    roleKey,
    title: `${organizationType.toUpperCase()} Standard Verification & Onboarding Form`,
    description: "Please provide your verified organization credentials and documentation for Super Admin review and authorization.",
    version: 1,
    status: "published",
    isDefault: true,
    fields: commonFields,
  };
}

/* =========================================================================
   USER CONTROLLERS
   ========================================================================= */

/**
 * GET /api/approvals/my-status
 * Returns the current authenticated user's onboarding status, form, submission, and feedback
 */
export async function getMyApprovalStatus(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
    }

    const orgType = (user.company_type || "startup").toLowerCase().trim();
    const roleKey = (user.investing_as || user.customRole?.slug || "default").toLowerCase().trim();

    // 1. Find tailored custom form for orgType + roleKey, or orgType + default, or default template (sorted by newest)
    let form = await ApprovalFormModel.findOne({
      organizationType: orgType,
      roleKey: roleKey,
      status: "published",
    }).sort({ updatedAt: -1, version: -1 });

    if (!form || !form.fields || form.fields.length === 0) {
      form = await ApprovalFormModel.findOne({
        organizationType: orgType,
        roleKey: "default",
        status: "published",
      }).sort({ updatedAt: -1, version: -1 });
    }

    if (!form || !form.fields || form.fields.length === 0) {
      form = await ApprovalFormModel.findOne({
        organizationType: orgType,
        status: "published",
      }).sort({ updatedAt: -1, version: -1 });
    }

    if (!form || !form.fields || form.fields.length === 0) {
      form = getBuiltInDefaultForm(orgType, roleKey);
    }

    const validFormId =
      form && form._id && mongoose.Types.ObjectId.isValid(form._id) ? form._id : null;

    // 2. Find or initialize user's submission
    let submission = await ApprovalSubmissionModel.findOne({ user: user._id })
      .populate("reviewedBy", "name email");

    if (!submission) {
      const appId = generateApplicationId();
      submission = await ApprovalSubmissionModel.create({
        applicationId: appId,
        user: user._id,
        organizationType: orgType,
        roleKey: roleKey,
        form: validFormId,
        formVersion: form.version || 1,
        formSnapshot: form.fields || [],
        responses: {},
        documents: [],
        status: user.approvalStatus || "Pending Form",
        auditLog: [
          {
            action: "USER_REGISTERED",
            previousStatus: "",
            newStatus: user.approvalStatus || "Pending Form",
            performedBy: user._id,
            performedByName: user.name || user.email,
            comment: "User account created and pending approval form completion.",
            timestamp: user.createdAt || new Date(),
          },
        ],
      });

      user.approvalSubmission = submission._id;
      if (!user.approvalStatus) {
        user.approvalStatus = "Pending Form";
      }
      await user.save();
    } else {
      // If user hasn't submitted yet or is updating, sync latest form fields
      if (submission.status === "Pending Form" || !submission.formSnapshot || submission.formSnapshot.length === 0) {
        submission.form = validFormId;
        submission.formVersion = form.version || 1;
        submission.formSnapshot = form.fields || [];
        await submission.save();
      }
    }

    const isExempt = user.role === "super_admin" || user.role === "admin";
    if (isExempt && user.approvalStatus !== "Approved") {
      user.approvalStatus = "Approved";
      await user.save();
    }

    const currentStatus = isExempt ? "Approved" : (user.approvalStatus || submission.status || "Pending Form");

    return res.status(200).json({
      status: 1,
      approvalStatus: currentStatus,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company_name: user.company_name,
        company_type: user.company_type,
        investing_as: user.investing_as,
        role: user.role,
        approvalStatus: currentStatus,
      },
      form,
      submission,
    });
  } catch (err) {
    console.error("Error in getMyApprovalStatus:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch approval status." });
  }
}

/**
 * POST /api/approvals/my-submission/draft
 * Save partial form draft responses without triggering strict validation
 */
export async function saveDraftSubmission(req, res) {
  try {
    const user = req.user;
    const { responses = {}, documents = [] } = req.body;

    let submission = await ApprovalSubmissionModel.findOne({ user: user._id });
    if (!submission) {
      const appId = generateApplicationId();
      submission = new ApprovalSubmissionModel({
        applicationId: appId,
        user: user._id,
        organizationType: user.company_type,
        roleKey: user.investing_as || "default",
        status: "Pending Form",
      });
    }

    submission.responses = { ...submission.responses, ...responses };
    if (Array.isArray(documents) && documents.length > 0) {
      submission.documents = documents;
    }

    submission.auditLog.push({
      action: "FORM_DRAFT_SAVED",
      previousStatus: submission.status,
      newStatus: submission.status,
      performedBy: user._id,
      performedByName: user.name,
      comment: "User saved form progress draft.",
      timestamp: new Date(),
    });

    await submission.save();

    return res.status(200).json({
      status: 1,
      msg: "Draft progress saved successfully.",
      submission,
    });
  } catch (err) {
    console.error("Error saving draft submission:", err);
    return res.status(500).json({ status: 0, msg: "Failed to save draft." });
  }
}

/**
 * POST /api/approvals/my-submission/submit
 * Validate all fields, finalize submission, and transition to "Form Submitted" / "Under Review"
 */
export async function submitApprovalForm(req, res) {
  try {
    const user = req.user;
    const { responses = {}, documents = [], formId } = req.body;

    const orgType = (user.company_type || "startup").toLowerCase().trim();
    const roleKey = user.investing_as || (user.customRole?.slug || "default").toLowerCase().trim();

    // Fetch form definition to validate
    let form = null;
    if (formId && mongoose.Types.ObjectId.isValid(formId)) {
      form = await ApprovalFormModel.findById(formId);
    }
    if (!form) {
      form = await ApprovalFormModel.findOne({
        organizationType: orgType,
        roleKey: roleKey,
        status: "published",
      });
    }
    if (!form) {
      form = getBuiltInDefaultForm(orgType, roleKey);
    }

    const fields = form.fields || [];
    const errors = {};

    // Validate each required field
    for (const field of fields) {
      const val = responses[field.key];

      if (field.required) {
        if (field.type === "file" || field.type === "image") {
          const docFound = documents.some((d) => d.fieldKey === field.key || d.fieldKey === field.id);
          const hasUrl = val && typeof val === "string" && val.trim().length > 0;
          if (!docFound && !hasUrl) {
            errors[field.key] = `${field.label} document is mandatory`;
          }
        } else if (field.type === "terms" || field.type === "checkbox") {
          if (!val) {
            errors[field.key] = `You must accept/confirm ${field.label}`;
          }
        } else if (val === undefined || val === null || String(val).trim() === "") {
          errors[field.key] = `${field.label} is mandatory`;
        }
      }

      // Rule validation (only for text/number fields, not files or checkboxes)
      if (
        field.type !== "file" &&
        field.type !== "image" &&
        field.type !== "terms" &&
        field.type !== "checkbox" &&
        val !== undefined &&
        val !== null &&
        String(val).trim() !== ""
      ) {
        if (field.validation?.minLength && String(val).trim().length < field.validation.minLength) {
          errors[field.key] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation?.maxLength && String(val).trim().length > field.validation.maxLength) {
          errors[field.key] = `${field.label} must not exceed ${field.validation.maxLength} characters`;
        }
        if (field.type === "number" && field.validation?.min !== null && Number(val) < field.validation?.min) {
          errors[field.key] = `${field.label} must be at least ${field.validation.min}`;
        }
        if (field.type === "number" && field.validation?.max !== null && Number(val) > field.validation?.max) {
          errors[field.key] = `${field.label} must not exceed ${field.validation.max}`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: 0,
        msg: "Please complete all mandatory fields and upload required documents before submitting.",
        errors,
      });
    }

    let submission = await ApprovalSubmissionModel.findOne({ user: user._id });
    if (!submission) {
      const appId = generateApplicationId();
      submission = new ApprovalSubmissionModel({
        applicationId: appId,
        user: user._id,
        organizationType: orgType,
        roleKey: roleKey,
      });
    }

    const previousStatus = submission.status || "Pending Form";
    const isResubmission = previousStatus === "Changes Requested";

    const validFormId =
      form && form._id && mongoose.Types.ObjectId.isValid(form._id) ? form._id : null;

    submission.form = validFormId;
    submission.formVersion = form.version || 1;
    submission.formSnapshot = fields;
    submission.responses = responses;
    submission.documents = documents;
    submission.status = "Form Submitted";
    submission.submittedAt = new Date();
    submission.adminFeedback = ""; // clear previous changes requested message

    submission.auditLog.push({
      action: isResubmission ? "RESUBMITTED" : "FORM_SUBMITTED",
      previousStatus,
      newStatus: "Form Submitted",
      performedBy: user._id,
      performedByName: user.name,
      comment: isResubmission
        ? "User updated and resubmitted application in response to admin request."
        : "User submitted completed verification form for Super Admin review.",
      timestamp: new Date(),
    });

    await submission.save();

    // Update user state
    user.approvalStatus = "Form Submitted";
    user.approvalSubmission = submission._id;
    await user.save();

    // Send confirmation email to user
    try {
      await sendMail(
        user.email,
        "Application Submitted for Super Admin Review — RealBell Foundation",
        `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #f59e0b; margin-top: 0;">Application Submitted Successfully</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for submitting your <strong>${form.title}</strong> for your <strong>${orgType.toUpperCase()}</strong> account.</p>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">Application Tracking ID:</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #f8fafc;">${submission.applicationId}</p>
          </div>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Our Super Admin review team is currently verifying your submitted documentation and credentials. You will receive an immediate notification as soon as your access is approved.
          </p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b; margin: 0;">
            © ${new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.
          </p>
        </div>
        `
      );
    } catch (mailErr) {
      console.error("Failed to send submission email:", mailErr);
    }

    return res.status(200).json({
      status: 1,
      msg: "Your verification form has been submitted for Super Admin review.",
      submission,
    });
  } catch (err) {
    console.error("Error submitting approval form:", err);
    return res.status(500).json({ status: 0, msg: "Failed to submit approval form." });
  }
}

/**
 * POST /api/approvals/upload-document
 * Upload a document attachment for an approval form field
 */
export async function uploadApprovalDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 0, msg: "No file selected for upload" });
    }

    const { fieldKey, fieldLabel } = req.body;
    const originalName = req.file.originalname || "document";
    const fileSize = req.file.size || 0;
    const mimeType = req.file.mimetype || "";

    const uploadRes = await uploadFileToCloud(req.file.buffer, originalName, {
      folder: "RBF_Approvals",
      resourceType: "auto",
      allowedFormats: null, // Allow all document formats (PDF, DOCX, DOC, Images, etc.)
    });

    const docItem = {
      fieldKey: fieldKey || "general_doc",
      fieldLabel: fieldLabel || originalName,
      fileName: originalName,
      fileUrl: uploadRes.secure_url,
      fileType: mimeType,
      fileSize,
      publicId: uploadRes.public_id || "",
      uploadedAt: new Date(),
    };

    return res.status(200).json({
      status: 1,
      msg: `${fieldLabel || "Document"} uploaded successfully`,
      document: docItem,
    });
  } catch (err) {
    console.error("Error uploading approval document:", err);
    return res.status(500).json({
      status: 0,
      msg: "Failed to upload document: " + (err.message || "Storage error"),
    });
  }
}

/* =========================================================================
   ADMIN CONTROLLERS
   ========================================================================= */

/**
 * GET /api/approvals/forms
 * Lists all configured approval forms
 */
export async function getApprovalForms(req, res) {
  try {
    const { organizationType, roleKey } = req.query;
    const filter = {};
    if (organizationType) filter.organizationType = organizationType.toLowerCase().trim();
    if (roleKey) filter.roleKey = roleKey.toLowerCase().trim();

    const forms = await ApprovalFormModel.find(filter)
      .sort({ organizationType: 1, roleKey: 1, createdAt: -1 })
      .populate("updatedBy", "name email");

    return res.status(200).json({
      status: 1,
      forms,
    });
  } catch (err) {
    console.error("Error in getApprovalForms:", err);
    return res.status(500).json({ status: 0, msg: "Failed to retrieve approval forms." });
  }
}

/**
 * GET /api/approvals/forms/:id
 * Get single form details
 */
export async function getApprovalFormById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid form ID" });
    }

    const form = await ApprovalFormModel.findById(id).populate("updatedBy", "name email");
    if (!form) {
      return res.status(404).json({ status: 0, msg: "Approval form not found" });
    }

    return res.status(200).json({ status: 1, form });
  } catch (err) {
    console.error("Error in getApprovalFormById:", err);
    return res.status(500).json({ status: 0, msg: "Failed to get approval form" });
  }
}

/**
 * POST /api/approvals/forms
 * Create or update an approval form with versioning
 */
export async function saveApprovalForm(req, res) {
  try {
    const adminUser = req.user;
    const {
      _id,
      organizationType,
      roleKey = "default",
      roleLabel = "All Roles",
      title,
      description = "",
      status = "published",
      fields = [],
    } = req.body;

    if (!organizationType || !title) {
      return res.status(400).json({ status: 0, msg: "Organization Type and Form Title are required." });
    }

    const orgTypeClean = organizationType.toLowerCase().trim();
    const roleKeyClean = roleKey.toLowerCase().trim();

    // Sanitize fields ensuring each has id, key, and label
    const sanitizedFields = fields.map((f, idx) => {
      const fieldId = f.id || `f_${idx}_${Date.now()}`;
      const fieldLabel = (f.label || `Field ${idx + 1}`).trim();
      const fieldKey = (f.key || fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, "_")).trim();
      return {
        ...f,
        id: fieldId,
        key: fieldKey,
        label: fieldLabel,
        type: f.type || "text",
        gridCols: f.gridCols || 1,
        required: Boolean(f.required),
        options: Array.isArray(f.options) ? f.options : [],
      };
    });

    let form = null;
    if (_id && mongoose.Types.ObjectId.isValid(_id)) {
      form = await ApprovalFormModel.findById(_id);
    }

    if (!form) {
      form = await ApprovalFormModel.findOne({
        organizationType: orgTypeClean,
        roleKey: roleKeyClean,
      });
    }

    if (form) {
      // If updating a published form, increment version
      if (form.status === "published") {
        form.version = (form.version || 1) + 1;
      }
      form.organizationType = orgTypeClean;
      form.roleKey = roleKeyClean;
      form.roleLabel = roleLabel;
      form.title = title;
      form.description = description;
      form.status = status;
      form.fields = sanitizedFields;
      form.updatedBy = adminUser._id;
      await form.save();
    } else {
      form = await ApprovalFormModel.create({
        organizationType: orgTypeClean,
        roleKey: roleKeyClean,
        roleLabel,
        title,
        description,
        version: 1,
        status,
        fields: sanitizedFields,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      });
    }

    // Sync latest form fields to any active "Pending Form" submissions of this orgType + roleKey
    try {
      await ApprovalSubmissionModel.updateMany(
        {
          organizationType: orgTypeClean,
          status: "Pending Form",
        },
        {
          $set: {
            form: form._id,
            formVersion: form.version,
            formSnapshot: sanitizedFields,
          },
        }
      );
    } catch (syncErr) {
      console.error("Error syncing updated form to submissions:", syncErr);
    }

    return res.status(200).json({
      status: 1,
      msg: `Approval form "${title}" saved successfully (Version ${form.version}).`,
      form,
    });
  } catch (err) {
    console.error("Error in saveApprovalForm:", err);
    return res.status(500).json({ status: 0, msg: "Failed to save approval form." });
  }
}

/**
 * DELETE /api/approvals/forms/:id
 * Delete or disable an approval form
 */
export async function deleteApprovalForm(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid form ID" });
    }

    await ApprovalFormModel.findByIdAndDelete(id);

    return res.status(200).json({
      status: 1,
      msg: "Approval form deleted successfully.",
    });
  } catch (err) {
    console.error("Error in deleteApprovalForm:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete approval form." });
  }
}

/**
 * GET /api/approvals/applications
 * List all approval applications with pagination, search, and filters
 */
export async function getApprovalApplications(req, res) {
  try {
    const {
      status,
      organizationType,
      roleKey,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (organizationType && organizationType !== "all") {
      filter.organizationType = organizationType.toLowerCase().trim();
    }

    if (roleKey && roleKey !== "all") {
      filter.roleKey = roleKey.toLowerCase().trim();
    }

    // User lookup if search term is provided
    if (search && search.trim()) {
      const term = search.trim();
      const matchingUsers = await OrganizationModel.find({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
          { company_name: { $regex: term, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { applicationId: { $regex: term, $options: "i" } },
        { user: { $in: userIds } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [applications, total] = await Promise.all([
      ApprovalSubmissionModel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email phone company_name company_type role accountStatus createdAt")
        .populate("reviewedBy", "name email"),
      ApprovalSubmissionModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 1,
      applications,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Error in getApprovalApplications:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch approval applications." });
  }
}

/**
 * GET /api/approvals/applications/:id
 * Detailed application inspection
 */
export async function getApplicationDetails(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid application ID" });
    }

    const application = await ApprovalSubmissionModel.findById(id)
      .populate("user", "name email phone company_name company_type investing_as role accountStatus customRole team createdAt")
      .populate("form")
      .populate("reviewedBy", "name email");

    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    return res.status(200).json({
      status: 1,
      application,
    });
  } catch (err) {
    console.error("Error in getApplicationDetails:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch application details." });
  }
}

/**
 * POST /api/approvals/applications/:id/review
 * Super Admin Decision: APPROVE, REJECT, or REQUEST_CHANGES
 */
export async function reviewApplication(req, res) {
  try {
    const adminUser = req.user;
    const { id } = req.params;
    const { action, comment = "", reason = "", feedback = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid application ID" });
    }

    const application = await ApprovalSubmissionModel.findById(id).populate("user");
    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    const user = application.user;
    if (!user) {
      return res.status(404).json({ status: 0, msg: "Applicant user account not found" });
    }

    const previousStatus = application.status;

    if (action === "APPROVE") {
      application.status = "Approved";
      application.reviewedBy = adminUser._id;
      application.reviewedAt = new Date();
      application.adminFeedback = "";
      application.rejectionReason = "";

      application.auditLog.push({
        action: "APPROVED",
        previousStatus,
        newStatus: "Approved",
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        comment: comment || "Application reviewed and approved by Super Admin.",
        timestamp: new Date(),
      });

      await application.save();

      // Update User Record to Approved state
      user.approvalStatus = "Approved";
      user.accountStatus = "active";
      user.approvedAt = new Date();
      user.approvedBy = adminUser._id;
      await user.save();

      // Send Approval Email
      try {
        await sendMail(
          user.email,
          "🎉 Welcome to RealBell Foundation — Your Account is Approved!",
          `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #090d16; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="display: inline-block; padding: 6px 16px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: bold; border-radius: 99px; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;">Account Verified & Approved</span>
            </div>
            <h1 style="color: #f8fafc; font-size: 24px; font-weight: 800; text-align: center; margin-top: 0;">Access Granted to RealBell Ecosystem</h1>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              We are pleased to inform you that your registration and verification application (ID: <strong style="color: #f59e0b;">${application.applicationId}</strong>) has been fully verified and approved by the Super Admin team.
            </p>
            <div style="background: #131c2e; padding: 20px; border-radius: 8px; border: 1px solid #334155; margin: 24px 0;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;"><strong>Organization:</strong> ${user.company_name}</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;"><strong>Track / Role:</strong> ${user.company_type?.toUpperCase()}</p>
              <p style="margin: 0; font-size: 14px; color: #34d399;"><strong>Status:</strong> Full Dashboard Access Active</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
              You can now access your founder portal, network with verified ecosystem stakeholders, discover cohorts, and participate in foundation initiatives.
            </p>
            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 28px 0;" />
            <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center;">
              © ${new Date().getFullYear()} RealBell Business Foundation.
            </p>
          </div>
          `
        );
      } catch (mailErr) {
        console.error("Failed to send approval email:", mailErr);
      }

      return res.status(200).json({
        status: 1,
        msg: `Application ${application.applicationId} for ${user.name} has been APPROVED.`,
        application,
      });
    }

    if (action === "REQUEST_CHANGES") {
      if (!feedback && !comment) {
        return res.status(400).json({ status: 0, msg: "Please specify the changes or corrections required." });
      }

      const feedbackText = feedback || comment;

      application.status = "Changes Requested";
      application.reviewedBy = adminUser._id;
      application.reviewedAt = new Date();
      application.adminFeedback = feedbackText;

      application.auditLog.push({
        action: "CHANGES_REQUESTED",
        previousStatus,
        newStatus: "Changes Requested",
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        comment: feedbackText,
        timestamp: new Date(),
      });

      await application.save();

      // Update user state
      user.approvalStatus = "Changes Requested";
      await user.save();

      // Send Changes Requested Email
      try {
        await sendMail(
          user.email,
          "Action Required: Information Update Needed for RealBell Application",
          `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-top: 0;">Action Required on Your Application</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Our review team evaluated your onboarding submission (ID: <strong>${application.applicationId}</strong>) and has requested additional information or corrections before final approval.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #f59e0b;">Admin Feedback / Requested Updates:</p>
              <p style="margin: 0; font-size: 14px; color: #f8fafc; white-space: pre-wrap;">${feedbackText}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
              Please log in to your account, update the requested fields in the Approval Center, and resubmit for review.
            </p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              © ${new Date().getFullYear()} RealBell Business Foundation.
            </p>
          </div>
          `
        );
      } catch (mailErr) {
        console.error("Failed to send changes requested email:", mailErr);
      }

      return res.status(200).json({
        status: 1,
        msg: `Changes requested for application ${application.applicationId}. User has been notified.`,
        application,
      });
    }

    if (action === "REJECT") {
      if (!reason && !comment) {
        return res.status(400).json({ status: 0, msg: "A reason is mandatory for rejecting an application." });
      }

      const reasonText = reason || comment;

      application.status = "Rejected";
      application.reviewedBy = adminUser._id;
      application.reviewedAt = new Date();
      application.rejectionReason = reasonText;

      application.auditLog.push({
        action: "REJECTED",
        previousStatus,
        newStatus: "Rejected",
        performedBy: adminUser._id,
        performedByName: adminUser.name,
        comment: reasonText,
        timestamp: new Date(),
      });

      await application.save();

      // Update user state
      user.approvalStatus = "Rejected";
      await user.save();

      // Send Rejection Email
      try {
        await sendMail(
          user.email,
          "Update regarding your RealBell Foundation Application",
          `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #ef4444; margin-top: 0;">Application Status Update</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Thank you for your interest in joining RealBell Business Foundation. After careful review of application <strong>${application.applicationId}</strong>, we regret to inform you that your application could not be approved at this time.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #ef4444;">Reason for Decision:</p>
              <p style="margin: 0; font-size: 14px; color: #f8fafc; white-space: pre-wrap;">${reasonText}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
              If you believe this decision was made in error or have updated credentials to provide, please reach out to admin support at support@realbell.org.
            </p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              © ${new Date().getFullYear()} RealBell Business Foundation.
            </p>
          </div>
          `
        );
      } catch (mailErr) {
        console.error("Failed to send rejection email:", mailErr);
      }

      return res.status(200).json({
        status: 1,
        msg: `Application ${application.applicationId} has been REJECTED.`,
        application,
      });
    }

    return res.status(400).json({ status: 0, msg: "Invalid review action specified." });
  } catch (err) {
    console.error("Error in reviewApplication:", err);
    return res.status(500).json({ status: 0, msg: "Failed to process review decision." });
  }
}

/**
 * GET /api/approvals/stats
 * Summary metrics for dashboard badges
 */
export async function getApprovalStats(req, res) {
  try {
    const [total, pendingForm, submitted, underReview, changesRequested, approved, rejected] = await Promise.all([
      ApprovalSubmissionModel.countDocuments(),
      ApprovalSubmissionModel.countDocuments({ status: "Pending Form" }),
      ApprovalSubmissionModel.countDocuments({ status: "Form Submitted" }),
      ApprovalSubmissionModel.countDocuments({ status: "Under Review" }),
      ApprovalSubmissionModel.countDocuments({ status: "Changes Requested" }),
      ApprovalSubmissionModel.countDocuments({ status: "Approved" }),
      ApprovalSubmissionModel.countDocuments({ status: "Rejected" }),
    ]);

    return res.status(200).json({
      status: 1,
      stats: {
        total,
        pendingForm,
        pendingReview: submitted + underReview,
        changesRequested,
        approved,
        rejected,
      },
    });
  } catch (err) {
    console.error("Error in getApprovalStats:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch approval stats." });
  }
}
