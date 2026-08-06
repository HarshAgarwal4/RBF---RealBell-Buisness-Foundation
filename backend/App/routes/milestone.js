import express from "express";
import {
  getReviewerOptions,
  createMilestone,
  getMyMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestone.js";

const milestoneRouter = express.Router();


milestoneRouter.get("/reviewers", getReviewerOptions); // dropdown data (accepted connections only)
milestoneRouter.post("/", createMilestone); // create a new milestone
milestoneRouter.get("/", getMyMilestones); // list mine (owned or reviewing), supports ?search=
milestoneRouter.get("/:id", getMilestoneById); // single milestone
milestoneRouter.patch("/:id", updateMilestone); // edit (owner only)
milestoneRouter.delete("/:id", deleteMilestone); // delete (owner only)

export default milestoneRouter;