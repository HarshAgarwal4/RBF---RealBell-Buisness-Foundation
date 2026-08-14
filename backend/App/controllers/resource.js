import ResourceModel from "../models/resource.js";
import { uploadFileToCloud, deleteImageByPublicId } from "../../services/upload.js";

/* ─────────────────────────────────────────────────────────────────
   Helper: upload a single file buffer to Cloudinary
   Returns { url, public_id, original_name }
───────────────────────────────────────────────────────────────── */
async function uploadSingle(file, folder, allowedFormats) {
  const result = await uploadFileToCloud(file.buffer, file.originalname, {
    folder,
    resourceType: "auto",
    allowedFormats,
  });
  return {
    url: result.secure_url || result.url,
    public_id: result.public_id || "",
    original_name: file.originalname,
  };
}

const PDF_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx"];
const IMG_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

/* ─────────────────────────────────────────────────────────────────
   GET /resources  — public (any logged-in user)
   Query: type, category, search, letter, industry, newsCategory, page, limit
───────────────────────────────────────────────────────────────── */
async function getResources(req, res) {
  try {
    const {
      type,
      category,
      search,
      letter,
      industry,
      newsCategory,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (letter) filter.letter = letter.toUpperCase();
    if (industry) filter.industry = industry;
    if (newsCategory) filter.newsCategory = newsCategory;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { definition: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [resources, total] = await Promise.all([
      ResourceModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ResourceModel.countDocuments(filter),
    ]);

    return res.json({ status: 1, resources, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────────
   POST /resources  — admin / super_admin only
   Accepts multipart/form-data:
     - file  field  → PDF / doc  (contracts, reports)
     - image field  → image      (news thumbnail, video thumbnail)
   All other fields come through req.body as text.
───────────────────────────────────────────────────────────────── */
async function createResource(req, res) {
  try {
    const body = { ...req.body, createdBy: req.user?._id };
    const files = req.files || {};

    /* ── Upload main file (PDF/doc) ── */
    if (files.file?.[0]) {
      const uploaded = await uploadSingle(
        files.file[0],
        "RBF/resources/files",
        PDF_FORMATS
      );
      body.fileUrl = uploaded.url;
      body.filePublicId = uploaded.public_id;
      body.fileName = uploaded.original_name;
    }

    /* ── Upload image (thumbnail / news cover) ── */
    if (files.image?.[0]) {
      const uploaded = await uploadSingle(
        files.image[0],
        "RBF/resources/images",
        IMG_FORMATS
      );
      body.imageUrl = uploaded.url;
      body.imagePublicId = uploaded.public_id;
    }

    const resource = new ResourceModel(body);
    await resource.save();
    return res.status(201).json({ status: 1, resource });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────────
   PUT /resources/:id  — admin / super_admin only
   Same multipart rules as POST; only replaces files that are sent.
───────────────────────────────────────────────────────────────── */
async function updateResource(req, res) {
  try {
    const existing = await ResourceModel.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ status: 0, msg: "Resource not found" });

    const body = { ...req.body };
    const files = req.files || {};

    /* ── Replace main file ── */
    if (files.file?.[0]) {
      // Delete old file from Cloudinary
      if (existing.filePublicId) {
        await deleteImageByPublicId(existing.filePublicId).catch(() => {});
      }
      const uploaded = await uploadSingle(
        files.file[0],
        "RBF/resources/files",
        PDF_FORMATS
      );
      body.fileUrl = uploaded.url;
      body.filePublicId = uploaded.public_id;
      body.fileName = uploaded.original_name;
    }

    /* ── Replace image ── */
    if (files.image?.[0]) {
      if (existing.imagePublicId) {
        await deleteImageByPublicId(existing.imagePublicId).catch(() => {});
      }
      const uploaded = await uploadSingle(
        files.image[0],
        "RBF/resources/images",
        IMG_FORMATS
      );
      body.imageUrl = uploaded.url;
      body.imagePublicId = uploaded.public_id;
    }

    const resource = await ResourceModel.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true, runValidators: true }
    );
    return res.json({ status: 1, resource });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────────
   DELETE /resources/:id  — admin / super_admin only
───────────────────────────────────────────────────────────────── */
async function deleteResource(req, res) {
  try {
    const resource = await ResourceModel.findByIdAndDelete(req.params.id);
    if (!resource)
      return res.status(404).json({ status: 0, msg: "Resource not found" });

    // Clean up Cloudinary files
    if (resource.filePublicId) {
      await deleteImageByPublicId(resource.filePublicId).catch(() => {});
    }
    if (resource.imagePublicId) {
      await deleteImageByPublicId(resource.imagePublicId).catch(() => {});
    }

    return res.json({ status: 1, msg: "Resource deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────────
   PATCH /resources/:id/download  — increment download count
───────────────────────────────────────────────────────────────── */
async function incrementDownload(req, res) {
  try {
    const resource = await ResourceModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    return res.json({ status: 1, downloadCount: resource?.downloadCount ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
}

export {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload,
};
