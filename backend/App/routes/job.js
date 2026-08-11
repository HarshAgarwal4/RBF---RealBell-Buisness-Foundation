import express from "express";
import { createUploadMiddleware } from '../../services/upload.js'
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  scheduleInterview,
  getUpcomingInterviews,
  applyJob,
} from '../controllers/job.js'

const jobRoutes = express.Router();
const jobUploadFile = createUploadMiddleware({
  maxFileSize: 20 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/rtf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
  ],
});

/**
 * JOB ROUTES
 */

// Fetch all jobs
jobRoutes.get("/", getJobs);

// Get upcoming scheduled interviews
jobRoutes.get("/upcoming-interviews", getUpcomingInterviews);

// Create a new job with file attachments
jobRoutes.post("/create", jobUploadFile.array("attachments", 5), createJob);
jobRoutes.post("/", jobUploadFile.array("attachments", 5), createJob);

// Schedule an interview
jobRoutes.post("/schedule-interview", scheduleInterview);

// Get single job details
jobRoutes.get("/:id", getJobById);

// Update job details
jobRoutes.put("/:id", jobUploadFile.array("attachments", 5), updateJob);

// Delete job
jobRoutes.delete("/:id", deleteJob);

// Apply to a job with resume attachment
jobRoutes.post("/:id/apply", jobUploadFile.single("resume"), applyJob);

export default jobRoutes;
