import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const roleRouter = express.Router();

// Get all roles (accessible by all users / signup)
roleRouter.get("/", getRoles);

// Admin / Super Admin routes
roleRouter.post("/", isAdmin, createRole);
roleRouter.put("/:id", isAdmin, updateRole);
roleRouter.delete("/:id", isAdmin, deleteRole);

export default roleRouter;
