import JobModel, { InterviewModel } from "../models/job.js";
import { uploadFileToCloud, deleteImageByUrl } from '../../services/upload.js'

// In-Memory Storage Fallback (Ensures full functionality when MongoDB is not connected)
const memoryJobs = [];
const memoryInterviews = [];
const JOB_ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "xls",
  "xlsx",
  "csv",
  "ppt",
  "pptx",
];

const collectUploadedFiles = (req) => {
  const files = [];

  if (Array.isArray(req.files) && req.files.length > 0) {
    files.push(...req.files);
  }

  if (req.file) {
    files.push(req.file);
  }

  return files;
};

const uploadJobFiles = async (files, folder = "RBF/jobs") => {
  const attachments = [];

  for (const file of files) {
    try {
      const uploaded = await uploadFileToCloud(file.buffer, file.originalname, {
        folder,
        allowedFormats: JOB_ALLOWED_FORMATS,
      });

      attachments.push({
        url: uploaded.secure_url || uploaded.url,
        public_id: uploaded.public_id || "",
        original_name: file.originalname,
      });
    } catch (uploadErr) {
      console.error("Error uploading file to cloud:", uploadErr);
    }
  }

  return attachments;
};

/**
 * Helper to check if Mongoose is connected
 */
const isMongooseConnected = () => {
  return JobModel.db && JobModel.db.readyState === 1;
};

/**
 * CREATE A NEW JOB
 * Endpoint: POST /api/jobs/create or POST /api/jobs
 */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      job_overview,
      employment_type,
      workplace_type,
      industry,
      position_open,
      locations,
      required_skills,
      good_to_have_skills,
      experience,
      min_ctc,
      max_ctc,
      hide_salary,
      expiry_date,
      organizationId,
    } = req.body;

    // Validate required fields
    if (!title || !job_overview || !employment_type || !workplace_type || !industry || !experience || !expiry_date) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields: title, job_overview, employment_type, workplace_type, industry, experience, expiry_date",
      });
    }

    // Process locations, skills if provided as string or array
    const parseArray = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          return field.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const parsedLocations = parseArray(locations);
    const parsedReqSkills = parseArray(required_skills).slice(0, 5); // Max 5 skills
    const parsedGoodSkills = parseArray(good_to_have_skills).slice(0, 5); // Max 5 skills

    const uploadedFiles = collectUploadedFiles(req);
    const attachments = uploadedFiles.length > 0
      ? await uploadJobFiles(uploadedFiles, "RBF/jobs/attachments")
      : [];

    const jobData = {
      title,
      job_overview,
      employment_type,
      workplace_type,
      industry,
      position_open: Number(position_open) || 1,
      locations: parsedLocations,
      required_skills: parsedReqSkills,
      good_to_have_skills: parsedGoodSkills,
      experience,
      salary: {
        min_ctc: Number(min_ctc) || 0,
        max_ctc: Number(max_ctc) || 0,
        hide_salary: hide_salary === "true" || hide_salary === true,
      },
      expiry_date: new Date(expiry_date),
      attachments,
      organization: organizationId || null,
      status: "active",
      applications: [],
      interviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let newJob;
    if (isMongooseConnected()) {
      newJob = await JobModel.create(jobData);
    } else {
      newJob = {
        _id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...jobData,
      };
      memoryJobs.unshift(newJob);
    }

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: newJob,
    });
  } catch (error) {
    console.error("Error in createJob:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error while creating job",
    });
  }
};

/**
 * GET ALL JOBS
 * Endpoint: GET /api/jobs
 */
export const getJobs = async (req, res) => {
  try {
    const { organization, search, status } = req.query;

    if (isMongooseConnected()) {
      let query = {};
      if (organization) query.organization = organization;
      if (status) query.status = status;
      if (search) {
        query.title = { $regex: search, $options: "i" };
      }
      const jobs = await JobModel.find(query).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: jobs.length, jobs });
    } else {
      let filtered = [...memoryJobs];
      if (status) filtered = filtered.filter((j) => j.status === status);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (j) =>
            j.title.toLowerCase().includes(s) ||
            j.industry.toLowerCase().includes(s)
        );
      }
      return res.status(200).json({ success: true, count: filtered.length, jobs: filtered });
    }
  } catch (error) {
    console.error("Error in getJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

/**
 * GET SINGLE JOB BY ID
 * Endpoint: GET /api/jobs/:id
 */
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongooseConnected()) {
      const job = await JobModel.findById(id).populate("organization", "company_name name email");
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }
      return res.status(200).json({ success: true, job });
    } else {
      const job = memoryJobs.find((j) => String(j._id) === String(id));
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }
      return res.status(200).json({ success: true, job });
    }
  } catch (error) {
    console.error("Error in getJobById:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * UPDATE A JOB
 * Endpoint: PUT /api/jobs/:id
 */
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const uploadedFiles = collectUploadedFiles(req);
    const newAttachments = uploadedFiles.length > 0
      ? await uploadJobFiles(uploadedFiles, "RBF/jobs/attachments")
      : [];

    if (isMongooseConnected()) {
      const existingJob = await JobModel.findById(id);
      if (!existingJob) return res.status(404).json({ success: false, message: "Job not found" });

      const updateData = { ...req.body, updatedAt: new Date() };
      if (newAttachments.length > 0) {
        updateData.attachments = [...(existingJob.attachments || []), ...newAttachments];
      }

      const updated = await JobModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: "Job not found" });
      return res.status(200).json({ success: true, message: "Job updated successfully", job: updated });
    } else {
      const index = memoryJobs.findIndex((j) => String(j._id) === String(id));
      if (index === -1) return res.status(404).json({ success: false, message: "Job not found" });
      const updateData = { ...req.body, updatedAt: new Date() };
      if (newAttachments.length > 0) {
        updateData.attachments = [...(memoryJobs[index].attachments || []), ...newAttachments];
      }
      memoryJobs[index] = { ...memoryJobs[index], ...updateData };
      return res.status(200).json({ success: true, message: "Job updated successfully", job: memoryJobs[index] });
    }
  } catch (error) {
    console.error("Error in updateJob:", error);
    return res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

/**
 * DELETE A JOB
 * Endpoint: DELETE /api/jobs/:id
 */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongooseConnected()) {
      const job = await JobModel.findById(id);
      if (!job) return res.status(404).json({ success: false, message: "Job not found" });

      // Clean up attachments from Cloudinary if present
      if (job.attachments && job.attachments.length > 0) {
        for (const att of job.attachments) {
          if (att.url) {
            try {
              await deleteImageByUrl(att.url);
            } catch (e) {
              console.warn("Could not delete attachment from Cloudinary:", e.message);
            }
          }
        }
      }

      await JobModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: "Job deleted successfully" });
    } else {
      const index = memoryJobs.findIndex((j) => String(j._id) === String(id));
      if (index === -1) return res.status(404).json({ success: false, message: "Job not found" });
      memoryJobs.splice(index, 1);
      return res.status(200).json({ success: true, message: "Job deleted successfully" });
    }
  } catch (error) {
    console.error("Error in deleteJob:", error);
    return res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

/**
 * SCHEDULE AN INTERVIEW
 * Endpoint: POST /api/jobs/schedule-interview
 */
export const scheduleInterview = async (req, res) => {
  try {
    const {
      job_id,
      candidate_name,
      candidate_email,
      round_name,
      date,
      time,
      interviewer_name,
      meeting_link,
      notes,
      organizationId,
    } = req.body;

    if (!candidate_name || !candidate_email || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Candidate name, email, date, and time are required for scheduling an interview.",
      });
    }

    let jobTitle = "General Interview";
    let targetJob = null;

    if (job_id) {
      if (isMongooseConnected()) {
        targetJob = await JobModel.findById(job_id);
        if (targetJob) jobTitle = targetJob.title;
      } else {
        targetJob = memoryJobs.find((j) => String(j._id) === String(job_id));
        if (targetJob) jobTitle = targetJob.title;
      }
    }

    const interviewData = {
      job_id: job_id || null,
      job_title: jobTitle,
      candidate_name,
      candidate_email,
      round_name: round_name || "Technical Round 1",
      date: new Date(date),
      time,
      interviewer_name: interviewer_name || "Hiring Manager",
      meeting_link: meeting_link || "https://meet.google.com/abc-defg-hij",
      notes: notes || "",
      organization: organizationId || null,
      status: "Scheduled",
      createdAt: new Date(),
    };

    let newInterview;
    if (isMongooseConnected()) {
      newInterview = await InterviewModel.create(interviewData);

      if (targetJob) {
        targetJob.interviews.push(newInterview._id);
        await targetJob.save();
      }
    } else {
      newInterview = {
        _id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...interviewData,
      };
      memoryInterviews.unshift(newInterview);

      if (targetJob) {
        targetJob.interviews = targetJob.interviews || [];
        targetJob.interviews.unshift(newInterview);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview: newInterview,
    });
  } catch (error) {
    console.error("Error in scheduleInterview:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to schedule interview",
    });
  }
};

/**
 * GET UPCOMING INTERVIEWS
 * Endpoint: GET /api/jobs/upcoming-interviews
 */
export const getUpcomingInterviews = async (req, res) => {
  try {
    if (isMongooseConnected()) {
      const interviews = await InterviewModel.find({
        status: { $in: ["Scheduled", "Rescheduled"] },
      }).sort({ date: 1, time: 1 });

      return res.status(200).json({
        success: true,
        count: interviews.length,
        interviews,
      });
    } else {
      const active = memoryInterviews.filter((i) => i.status === "Scheduled" || i.status === "Rescheduled");
      return res.status(200).json({
        success: true,
        count: active.length,
        interviews: active,
      });
    }
  } catch (error) {
    console.error("Error in getUpcomingInterviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming interviews",
    });
  }
};

/**
 * APPLY TO A JOB
 * Endpoint: POST /api/jobs/:id/apply
 */
export const applyJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidate_name, candidate_email, candidate_phone, cover_letter } = req.body;

    if (!candidate_name || !candidate_email) {
      return res.status(400).json({ success: false, message: "Candidate name and email are required" });
    }

    let resume_url = "";
    if (req.file) {
      const uploaded = await uploadFileToCloud(req.file.buffer, req.file.originalname, {
        folder: "RBF/jobs/resumes",
        allowedFormats: JOB_ALLOWED_FORMATS,
      });
      resume_url = uploaded.secure_url || uploaded.url;
    }

    const application = {
      candidate_name,
      candidate_email,
      candidate_phone: candidate_phone || "",
      cover_letter: cover_letter || "",
      resume_url,
      appliedAt: new Date(),
      status: "Applied",
    };

    if (isMongooseConnected()) {
      const job = await JobModel.findById(id);
      if (!job) return res.status(404).json({ success: false, message: "Job not found" });
      job.applications.push(application);
      await job.save();
      return res.status(200).json({ success: true, message: "Application submitted successfully" });
    } else {
      const job = memoryJobs.find((j) => String(j._id) === String(id));
      if (!job) return res.status(404).json({ success: false, message: "Job not found" });
      job.applications = job.applications || [];
      job.applications.push(application);
      return res.status(200).json({ success: true, message: "Application submitted successfully" });
    }
  } catch (error) {
    console.error("Error in applyJob:", error);
    return res.status(500).json({ success: false, message: "Failed to submit application" });
  }
};
