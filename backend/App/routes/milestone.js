import express from "express";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import {
  getReviewerOptions,
  createMilestone,
  getMyMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestone.js";

const milestoneRouter = express.Router();

milestoneRouter.get("/reviewers", requireSubscription("milestones"), getReviewerOptions);
milestoneRouter.post("/", requireSubscription("milestones"), createMilestone);
milestoneRouter.get("/", requireSubscription("milestones"), getMyMilestones);
milestoneRouter.get("/:id", requireSubscription("milestones"), getMilestoneById);
milestoneRouter.patch("/:id", requireSubscription("milestones"), updateMilestone);
milestoneRouter.delete("/:id", requireSubscription("milestones"), deleteMilestone);

export default milestoneRouter;