import express from "express";
import {
    fetchOrganizationById,
    fetchOrganizationsByType,
    toggleConnectionRequest,
    toggleSaveProfile,
} from "../controllers/organization.js";

const connectRoutes = express.Router();

connectRoutes.get("/profile/:id", fetchOrganizationById);
connectRoutes.get("/:type", fetchOrganizationsByType);
connectRoutes.post("/:id/save", toggleSaveProfile);
connectRoutes.post("/:id/connect", toggleConnectionRequest);

export { connectRoutes };
