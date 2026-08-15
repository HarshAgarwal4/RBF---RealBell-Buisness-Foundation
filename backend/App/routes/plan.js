import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
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

/* Admin Routes */
planRouter.get("/admin", isAdmin, getAllPlansAdmin);
planRouter.post("/admin", isAdmin, createPlan);
planRouter.put("/admin/:id", isAdmin, updatePlan);
planRouter.delete("/admin/:id", isAdmin, deletePlan);

export default planRouter;
