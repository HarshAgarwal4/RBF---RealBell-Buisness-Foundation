import express from "express";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
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
connectRoutes.get("/connections", requireSubscription("connections"), fetchMyConnections);
connectRoutes.get("/:type", fetchOrganizationsByType);
connectRoutes.post("/:id/save", toggleSaveProfile);
connectRoutes.post("/:id/connect", requireSubscription("connections"), toggleConnectionRequest);
connectRoutes.post("/:id/respond", requireSubscription("connections"), respondConnectionRequest);

export { connectRoutes };
