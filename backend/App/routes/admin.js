import express from "express";
import { isAdmin, isSuperAdmin, authorize } from "../../middlewares/admin.js";
import {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAllJobs,
    deleteJob,
    getAllTickets,
    getAssignableUsersAndTeams,
    assignOrForwardTicket,
    addTicketInternalNote,
    updateTicketStatus,
    deleteTicket,
    getAllCommunityPosts,
    deletePost,
    togglePinPost,
    getAnalytics,
    getRecentActivity,
    sendInviteMemberOTP,
    inviteOrAddAdminUser,
    updateUserRoleAndTeam,
    updateUserDetails,
    toggleUserStatus,
} from "../controllers/admin.js";
import {
    getAdminAuthSettings,
    updateAuthSettings,
} from "../controllers/authSettingController.js";
import {
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeamMembers,
} from "../controllers/teamController.js";
import {
    getCustomRoles,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
    getAvailablePermissions,
} from "../controllers/customRoleController.js";
import { getAuditLogs } from "../controllers/auditLogController.js";
import {
    getAdminPagesList,
    getAdminPageContent,
    updatePageContent,
    resetPageContent,
} from "../controllers/frontendCustomizerController.js";

const adminRouter = express.Router();

/* ── Frontend Customizer ── */
adminRouter.get("/frontend-customizer/pages", authorize(["frontend_customizer.view", "theme.manage"]), getAdminPagesList);
adminRouter.get("/frontend-customizer/pages/:pageKey", authorize(["frontend_customizer.view", "theme.manage"]), getAdminPageContent);
adminRouter.put("/frontend-customizer/pages/:pageKey", authorize(["frontend_customizer.update", "theme.manage"]), updatePageContent);
adminRouter.post("/frontend-customizer/pages/:pageKey/reset", authorize(["frontend_customizer.update", "theme.manage"]), resetPageContent);

// Base admin gate (ensures authenticated admin/custom-role user)
adminRouter.use(isAdmin);

/* ── Dashboard & Analytics ── */
adminRouter.get("/stats", authorize("dashboard.view"), getDashboardStats);
adminRouter.get("/activity", authorize("dashboard.view"), getRecentActivity);
adminRouter.get("/analytics", authorize("analytics.view"), getAnalytics);

/* ── Auth Settings ── */
adminRouter.get("/auth-settings", authorize("auth_settings.view"), getAdminAuthSettings);
adminRouter.put("/auth-settings", authorize("auth_settings.update"), updateAuthSettings);

/* ── Users & Invitations ── */
adminRouter.get("/users", authorize(["users.view", "teams.view"]), getAllUsers);
adminRouter.get("/users/:id", authorize("users.view"), getUserById);
adminRouter.put("/users/:id", authorize("users.update"), updateUserDetails);
adminRouter.patch("/users/:id", authorize("users.update"), updateUserDetails);
adminRouter.post("/users/send-invite-otp", authorize("users.create"), sendInviteMemberOTP);
adminRouter.post("/users/invite", authorize("users.create"), inviteOrAddAdminUser);
adminRouter.patch("/users/:id/role", authorize(["users.update", "users.assign_role"]), updateUserRole);
adminRouter.patch("/users/:id/assignment", authorize("users.assign_role"), updateUserRoleAndTeam);
adminRouter.patch("/users/:id/status", authorize("users.update"), toggleUserStatus);
adminRouter.delete("/users/:id", authorize("users.delete"), deleteUser);

/* ── Teams Management ── */
adminRouter.get("/teams", authorize(["teams.view", "users.view"]), getTeams);
adminRouter.post("/teams", authorize("teams.create"), createTeam);
adminRouter.put("/teams/:id", authorize("teams.update"), updateTeam);
adminRouter.delete("/teams/:id", authorize("teams.delete"), deleteTeam);
adminRouter.get("/teams/:id/members", authorize("teams.view"), getTeamMembers);

/* ── Custom RBAC Roles ── */
adminRouter.get("/custom-roles/permissions", authorize(["teams.view", "roles.create", "roles.update"]), getAvailablePermissions);
adminRouter.get("/custom-roles", authorize(["teams.view", "roles.create", "roles.update"]), getCustomRoles);
adminRouter.post("/custom-roles", authorize("roles.create"), createCustomRole);
adminRouter.put("/custom-roles/:id", authorize("roles.update"), updateCustomRole);
adminRouter.delete("/custom-roles/:id", authorize("roles.delete"), deleteCustomRole);

/* ── Audit Logs ── */
adminRouter.get("/audit-logs", authorize("audit_logs.view"), getAuditLogs);

/* ── Jobs ── */
adminRouter.get("/jobs", authorize("jobs.view"), getAllJobs);
adminRouter.delete("/jobs/:id", authorize("jobs.delete"), deleteJob);

/* ── Tickets ── */
// Open to all admins/team members for their personal and common team ticket sections
adminRouter.get("/tickets", getAllTickets);
adminRouter.get("/tickets/assignees", getAssignableUsersAndTeams);
adminRouter.patch("/tickets/:id/assign", authorize("tickets.assign"), assignOrForwardTicket);
adminRouter.post("/tickets/:id/notes", addTicketInternalNote);
adminRouter.patch("/tickets/:id/status", updateTicketStatus);
adminRouter.delete("/tickets/:id", authorize("tickets.delete"), deleteTicket);

import { uploadFile } from "../../services/upload.js";
import {
    getRecipientsDirectory,
    sendAdminNotification,
    getAdminNotifications,
    updateAdminNotification,
    deleteAdminNotification,
    sendAdminMail,
    getAdminMailLogs,
    deleteAdminMailLog,
} from "../controllers/communicationController.js";

/* ── Recipients Directory Helper ── */
adminRouter.get("/recipients/directory", authorize(["notifications.view", "mail.view", "notifications.send", "mail.send"]), getRecipientsDirectory);

/* ── Notifications Hub (Super Admin & Authorized RBAC) ── */
adminRouter.get("/notifications", authorize("notifications.view"), getAdminNotifications);
adminRouter.post("/notifications/send", authorize("notifications.send"), uploadFile.array("files", 10), sendAdminNotification);
adminRouter.put("/notifications/:id", authorize("notifications.send"), uploadFile.array("files", 10), updateAdminNotification);
adminRouter.delete("/notifications/:id", authorize("notifications.delete"), deleteAdminNotification);

/* ── Mail Dispatcher (Super Admin & Authorized RBAC) ── */
adminRouter.get("/mail", authorize("mail.view"), getAdminMailLogs);
adminRouter.post("/mail/send", authorize("mail.send"), uploadFile.array("files", 10), sendAdminMail);
adminRouter.delete("/mail/:id", authorize("mail.delete"), deleteAdminMailLog);

/* ── Community ── */
adminRouter.get("/community", authorize("community.view"), getAllCommunityPosts);
adminRouter.delete("/community/:id", authorize("community.delete"), deletePost);
adminRouter.patch("/community/:id/pin", authorize("community.moderate"), togglePinPost);

export default adminRouter;

