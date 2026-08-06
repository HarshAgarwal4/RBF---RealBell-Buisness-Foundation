import Milestone from "../models/milestone.js";
import Organization from "../models/organization.js";

export const getReviewerOptions = async (req, res) => {
  try {
    const org = await Organization.findById(req.user._id).populate(
      "connections.with",
      "name company_name email"
    );

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const reviewers = org.connections
      .filter((c) => c.status === "accepted")
      .map((c) => c.with);

    res.status(200).json({ reviewers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviewers", error: error.message });
  }
};

/**
 * POST /api/milestones
 * Create a new milestone owned by the logged-in org.
 */
export const createMilestone = async (req, res) => {
  try {
    const {
      title,
      description,
      reviewers,
      startDate,
      targetDate,
      progressReporting,
      qualitativeTasks,
      quantitativeTasks,
    } = req.body;

    if (!title || !description || !startDate || !targetDate || !progressReporting) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    if (!Array.isArray(qualitativeTasks) || qualitativeTasks.length === 0) {
      return res.status(400).json({ message: "At least one qualitative task is required." });
    }

    if (!Array.isArray(quantitativeTasks) || quantitativeTasks.length === 0) {
      return res.status(400).json({ message: "At least one quantitative task is required." });
    }

    // If reviewers were provided, make sure they're all accepted connections
    if (reviewers && reviewers.length > 0) {
      const org = await Organization.findById(req.user._id);
      const acceptedIds = org.connections
        .filter((c) => c.status === "accepted")
        .map((c) => c.with.toString());

      const invalid = reviewers.some((r) => !acceptedIds.includes(r));
      if (invalid) {
        return res
          .status(403)
          .json({ message: "Reviewers must be one of your connections." });
      }
    }

    const milestone = await Milestone.create({
      organization: req.user._id,
      title,
      description,
      reviewers: reviewers || [],
      startDate,
      targetDate,
      progressReporting,
      qualitativeTasks,
      quantitativeTasks,
    });

    res.status(201).json({ message: "Milestone created successfully", milestone });
  } catch (error) {
    res.status(500).json({ message: "Failed to create milestone", error: error.message });
  }
};

/**
 * GET /api/milestones
 * All milestones owned by the logged-in org, or where they are a reviewer.
 * Supports optional ?search= query on title.
 */
export const getMyMilestones = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {
      $or: [{ organization: req.user._id }, { reviewers: req.user._id }],
    };

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const milestones = await Milestone.find(filter)
      .populate("organization", "name company_name")
      .populate("reviewers", "name company_name")
      .sort({ createdAt: -1 });

    res.status(200).json({ milestones });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch milestones", error: error.message });
  }
};

/**
 * GET /api/milestones/:id
 */
export const getMilestoneById = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id)
      .populate("organization", "name company_name")
      .populate("reviewers", "name company_name");

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    res.status(200).json({ milestone });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch milestone", error: error.message });
  }
};

/**
 * PATCH /api/milestones/:id
 * Owner-only edit (title, description, tasks, dates, status, etc).
 */
export const updateMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (milestone.organization.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this milestone" });
    }

    const updatable = [
      "title",
      "description",
      "reviewers",
      "startDate",
      "targetDate",
      "progressReporting",
      "qualitativeTasks",
      "quantitativeTasks",
      "status",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        milestone[field] = req.body[field];
      }
    });

    await milestone.save();

    res.status(200).json({ message: "Milestone updated", milestone });
  } catch (error) {
    res.status(500).json({ message: "Failed to update milestone", error: error.message });
  }
};

/**
 * DELETE /api/milestones/:id
 * Owner-only.
 */
export const deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (milestone.organization.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this milestone" });
    }

    await milestone.deleteOne();

    res.status(200).json({ message: "Milestone deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete milestone", error: error.message });
  }
};