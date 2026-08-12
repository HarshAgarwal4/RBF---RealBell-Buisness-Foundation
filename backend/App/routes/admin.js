import express from "express";
import { isAdmin, isSuperAdmin } from "../../middlewares/admin.js";
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAllJobs,
    deleteJob,
    getAllTickets,
    updateTicketStatus,
    deleteTicket,
    getAllCommunityPosts,
    deletePost,
    togglePinPost,
    getAnalytics,
    getRecentActivity,
} from "../controllers/admin.js";

const adminRouter = express.Router();

// All admin routes require isAdmin middleware
adminRouter.use(isAdmin);

/* ── Dashboard ── */
adminRouter.get("/stats", getDashboardStats);
adminRouter.get("/activity", getRecentActivity);
adminRouter.get("/analytics", getAnalytics);

/* ── Users ── */
adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:id", getUserById);
adminRouter.patch("/users/:id/role", updateUserRole);
adminRouter.delete("/users/:id", isSuperAdmin, deleteUser);  // only super_admin can delete

/* ── Jobs ── */
adminRouter.get("/jobs", getAllJobs);
adminRouter.delete("/jobs/:id", deleteJob);

/* ── Tickets ── */
adminRouter.get("/tickets", getAllTickets);
adminRouter.patch("/tickets/:id/status", updateTicketStatus);
adminRouter.delete("/tickets/:id", deleteTicket);

/* ── Community ── */
adminRouter.get("/community", getAllCommunityPosts);
adminRouter.delete("/community/:id", deletePost);
adminRouter.patch("/community/:id/pin", togglePinPost);

export default adminRouter;
