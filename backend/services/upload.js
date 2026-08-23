import multer from "multer";
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DEFAULT_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
  "doc",
  "docx",
  "txt",
  "csv",
  "xlsx",
  "xls",
];

const createUploadMiddleware = ({
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedMimeTypes,
} = {}) => {
  const config = {
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize },
  };

  if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
    config.fileFilter = (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
      }

      return cb(
        new Error(`Unsupported file type: ${file.mimetype}`)
      );
    };
  }

  return multer(config);
};

const uploadFile = createUploadMiddleware();

async function uploadFileToCloud(fileBuffer, originalName, options = {}) {
  const {
    folder = "RBF",
    resourceType = "auto",
    allowedFormats = null, // null allows all formats (PDF, DOC, DOCX, images) via auto detection
  } = options;

  const sanitizedName = String(originalName || "document")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .slice(-80);

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    public_id: `${Date.now()}-${sanitizedName}`,
  };

  if (Array.isArray(allowedFormats) && allowedFormats.length > 0) {
    uploadOptions.allowed_formats = allowedFormats;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          return reject(error);
        }
        console.log("Uploaded to Cloudinary:", result.secure_url);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

async function deleteImageByPublicId(publicId) {
  try {
    const tryDelete = async (resourceType) =>
      cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType });

    let result = await tryDelete("image");
    if (result?.result === "not found") {
      result = await tryDelete("raw");
    }

    console.log("Deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    throw error;
  }
}

async function deleteImageByUrl(imageUrl) {
    try {
        if (!imageUrl) throw new Error("Image URL is required");

        let match = imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (!match || !match[1]) throw new Error("Invalid Cloudinary URL format");

        let publicId = match[1];  
        let result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        if (result?.result === "not found") {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        }

        return result;
    } catch (error) {
        console.error("Error deleting Cloudinary image:", error);
        throw error;
    }
}

export { createUploadMiddleware, uploadFile, uploadFileToCloud, deleteImageByPublicId , deleteImageByUrl };
