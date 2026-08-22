import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import {
  getActivePlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/planController.js";

const planRouter = express.Router();

/* Public / User Routes */
planRouter.get("/", getActivePlans);

/* Admin Routes with RBAC */
planRouter.get("/admin", isAdmin, authorize("subscriptions.view"), getAllPlansAdmin);
planRouter.post("/admin", isAdmin, authorize("subscriptions.create"), createPlan);
planRouter.put("/admin/:id", isAdmin, authorize("subscriptions.update"), updatePlan);
planRouter.delete("/admin/:id", isAdmin, authorize("subscriptions.delete"), deletePlan);

export default planRouter;
