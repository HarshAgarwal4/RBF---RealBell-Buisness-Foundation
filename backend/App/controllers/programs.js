import mongoose from "mongoose";
import ProgramModel from "../models/program.js";
import ProgramApplicationModel from "../models/programApplication.js";
import { uploadFileToCloud } from "../../services/upload.js";
import fetch from "node-fetch";

/* ── Helper: upload banner + logo from req.files ── */
async function uploadProgramImages(files = {}) {
  const results = {};
  const IMG_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

  if (files.banner_image?.[0]) {
    const f = files.banner_image[0];
    const r = await uploadFileToCloud(f.buffer, f.originalname, {
      folder: "RBF/programs/banners",
      resourceType: "image",
      allowedFormats: IMG_FORMATS,
    });
    results.banner_image = r.secure_url || r.url;
  }

  if (files.logo?.[0]) {
    const f = files.logo[0];
    const r = await uploadFileToCloud(f.buffer, f.originalname, {
      folder: "RBF/programs/logos",
      resourceType: "image",
      allowedFormats: IMG_FORMATS,
    });
    results.logo = r.secure_url || r.url;
  }

  return results;
}

/* ══════════════════════════════════════════════════
   PUBLIC — User-facing routes
══════════════════════════════════════════════════ */

/** GET /programs/public  — list all published programs */
async function getAllProgramsPublic(req, res) {
  try {
    const { search = "", tag = "" } = req.query;
    const query = { status: "published" };
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
      ];
    if (tag) query.tags = tag;

    const programs = await ProgramModel.find(query)
      .sort({ createdAt: -1 })
      .populate("created_by", "name company_name account")
      .select("-custom_form_fields -ai_raw_input -rich_blocks -ai_content");

    return res.json({ status: 1, programs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /programs/public/:id  — get a single published program (full details) */
async function getProgramByIdPublic(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const program = await ProgramModel.findOne({ _id: id, status: "published" })
      .populate("created_by", "name company_name account");
    if (!program)
      return res.status(404).json({ status: 9, msg: "Program not found" });

    // Check if current user already applied
    const existing = await ProgramApplicationModel.findOne({
      program: id,
      applicant: req.user._id,
    }).select("status");

    return res.json({ status: 1, program, myApplication: existing || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /programs/apply/:id  — submit application */
async function applyToProgram(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const program = await ProgramModel.findOne({ _id: id, status: "published" });
    if (!program)
      return res.status(404).json({ status: 9, msg: "Program not found" });

    // Deadline check
    if (program.application_deadline && new Date() > program.application_deadline)
      return res.status(400).json({ status: 7, msg: "Application deadline has passed" });

    // Duplicate check
    const existing = await ProgramApplicationModel.findOne({
      program: id,
      applicant: req.user._id,
    });
    if (existing)
      return res.status(400).json({ status: 7, msg: "You have already applied to this program" });

    const { custom_responses = [] } = req.body;

    // Validate required fields
    for (const field of program.custom_form_fields) {
      if (field.required) {
        const resp = custom_responses.find((r) => r.field_id === field.id);
        if (!resp || resp.value === "" || resp.value === null || resp.value === undefined) {
          return res.status(400).json({
            status: 7,
            msg: `Field "${field.label}" is required`,
          });
        }
      }
    }

    const application = await ProgramApplicationModel.create({
      program: id,
      applicant: req.user._id,
      custom_responses,
    });

    return res.json({ status: 1, msg: "Application submitted successfully", application });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /programs/my-applications  — current user's applications */
async function getMyApplications(req, res) {
  try {
    const applications = await ProgramApplicationModel.find({
      applicant: req.user._id,
    })
      .populate("program", "title short_description banner_image logo status application_deadline")
      .sort({ createdAt: -1 });

    return res.json({ status: 1, applications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ══════════════════════════════════════════════════
   ADMIN — Management routes
══════════════════════════════════════════════════ */

/** GET /programs/admin  — list all programs (any status) */
async function getAllProgramsAdmin(req, res) {
  try {
    const { status = "", search = "" } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
      ];

    const programs = await ProgramModel.find(query)
      .sort({ createdAt: -1 })
      .populate("created_by", "name company_name account");

    return res.json({ status: 1, programs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /programs/admin/:id  — get single program with full details */
async function getProgramByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const program = await ProgramModel.findById(id).populate(
      "created_by",
      "name company_name"
    );
    if (!program)
      return res.status(404).json({ status: 9, msg: "Program not found" });

    const applicationCount = await ProgramApplicationModel.countDocuments({ program: id });

    return res.json({ status: 1, program, applicationCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /programs/admin  — create a new program */
async function createProgram(req, res) {
  try {
    // Parse JSON fields that may be sent as strings in multipart/form-data
    const body = req.body;
    const parse = (key) => {
      try { return typeof body[key] === "string" ? JSON.parse(body[key]) : body[key]; }
      catch { return body[key]; }
    };

    const {
      title,
      short_description,
      status,
      content_type,
      ai_raw_input,
      ai_content,
      application_deadline,
    } = body;

    const rich_blocks = parse("rich_blocks") || [];
    const custom_form_fields = parse("custom_form_fields") || [];
    const tags = parse("tags") || [];
    const external_links = parse("external_links") || [];

    if (!title) return res.status(400).json({ status: 7, msg: "Title is required" });

    // Upload images to Cloudinary
    const images = await uploadProgramImages(req.files || {});

    const program = await ProgramModel.create({
      title,
      short_description,
      banner_image: images.banner_image || "",
      logo: images.logo || "",
      created_by: req.user._id,
      status: status || "draft",
      content_type: content_type || "rich_editor",
      ai_raw_input,
      ai_content,
      rich_blocks,
      custom_form_fields,
      application_deadline: application_deadline || null,
      tags,
      external_links,
    });

    return res.json({ status: 1, msg: "Program created successfully", program });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** PUT /programs/admin/:id  — update a program */
async function updateProgram(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const body = req.body;
    const parse = (key) => {
      try { return typeof body[key] === "string" ? JSON.parse(body[key]) : body[key]; }
      catch { return body[key]; }
    };

    const allowed = [
      "title", "short_description", "status",
      "content_type", "ai_raw_input", "ai_content",
      "application_deadline",
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    // Parse JSON array fields
    if (body.rich_blocks !== undefined) updates.rich_blocks = parse("rich_blocks");
    if (body.custom_form_fields !== undefined) updates.custom_form_fields = parse("custom_form_fields");
    if (body.tags !== undefined) updates.tags = parse("tags");
    if (body.external_links !== undefined) updates.external_links = parse("external_links");

    // Upload new images if provided
    const images = await uploadProgramImages(req.files || {});
    if (images.banner_image) updates.banner_image = images.banner_image;
    if (images.logo) updates.logo = images.logo;

    const program = await ProgramModel.findByIdAndUpdate(id, updates, { new: true });
    if (!program) return res.status(404).json({ status: 9, msg: "Program not found" });

    return res.json({ status: 1, msg: "Program updated successfully", program });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** DELETE /programs/admin/:id  — delete a program */
async function deleteProgram(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const program = await ProgramModel.findByIdAndDelete(id);
    if (!program) return res.status(404).json({ status: 9, msg: "Program not found" });

    // Delete all applications for this program
    await ProgramApplicationModel.deleteMany({ program: id });

    return res.json({ status: 1, msg: "Program deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /programs/admin/ai-generate  — generate formatted markdown using AI */
async function generateAIContent(req, res) {
  try {
    const { raw_text } = req.body;
    if (!raw_text || raw_text.trim().length < 10)
      return res.status(400).json({ status: 7, msg: "Please provide more text to format" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are an expert content formatter. Your job is to take raw program/initiative descriptions and transform them into beautiful, structured markdown. Use clear headings (##, ###), bullet points, bold text for highlights, and organized sections. Make it engaging, professional, and easy to read. Only return the formatted markdown, nothing else.",
          },
          {
            role: "user",
            content: `Please format this program description into beautiful markdown:\n\n${raw_text}`,
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return res.status(500).json({ status: 0, msg: "AI generation failed" });
    }

    const data = await response.json();
    const formatted = data.choices?.[0]?.message?.content || "";

    return res.json({ status: 1, formatted_content: formatted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ──── Application Management ──── */

/** GET /programs/admin/:id/applications  — list applications for a program */
async function getAllApplications(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid program id" });

    const { status = "" } = req.query;
    const query = { program: id };
    if (status) query.status = status;

    const applications = await ProgramApplicationModel.find(query)
      .populate(
        "applicant",
        "name company_name email phone company_type profile account"
      )
      .sort({ createdAt: -1 });

    return res.json({ status: 1, applications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** PATCH /programs/admin/applications/:appId/status  — approve or reject */
async function updateApplicationStatus(req, res) {
  try {
    const { appId } = req.params;
    const { status, admin_note } = req.body;

    if (!mongoose.isValidObjectId(appId))
      return res.status(400).json({ status: 7, msg: "Invalid application id" });

    if (!["pending", "approved", "rejected"].includes(status))
      return res.status(400).json({ status: 7, msg: "Invalid status" });

    const application = await ProgramApplicationModel.findByIdAndUpdate(
      appId,
      { status, admin_note: admin_note || "" },
      { new: true }
    ).populate("applicant", "name company_name email");

    if (!application)
      return res.status(404).json({ status: 9, msg: "Application not found" });

    return res.json({ status: 1, msg: `Application ${status}`, application });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

export {
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
};
