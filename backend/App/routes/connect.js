import express from "express";
import {
    fetchOrganizationById,
    fetchMyConnections,
    fetchOrganizationsByType,
    respondConnectionRequest,
    toggleConnectionRequest,
    toggleSaveProfile,
} from "../controllers/organization.js";

const connectRoutes = express.Router();

connectRoutes.get("/profile/:id", fetchOrganizationById);
connectRoutes.get("/connections", fetchMyConnections);
connectRoutes.get("/:type", fetchOrganizationsByType);
connectRoutes.post("/:id/save", toggleSaveProfile);
connectRoutes.post("/:id/connect", toggleConnectionRequest);
connectRoutes.post("/:id/respond", respondConnectionRequest);

export { connectRoutes };
