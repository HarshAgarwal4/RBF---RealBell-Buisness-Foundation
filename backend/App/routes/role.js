import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
import {
  getRoles,
  reorderRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const roleRouter = express.Router();

// Get all roles (accessible by all users / signup)
roleRouter.get("/", getRoles);

// Reorder roles route (MUST be placed before /:id)
roleRouter.put("/reorder", isAdmin, reorderRoles);
roleRouter.post("/reorder", isAdmin, reorderRoles);

// Admin / Super Admin CRUD routes
roleRouter.post("/", isAdmin, createRole);
roleRouter.put("/:id", isAdmin, updateRole);
roleRouter.delete("/:id", isAdmin, deleteRole);

export default roleRouter;
