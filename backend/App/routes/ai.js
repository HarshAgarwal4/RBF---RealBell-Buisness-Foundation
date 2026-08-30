import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import { requireSubscription } from "../../middlewares/subscriptionGuard.js";
import {
  getPublicAiInfo,
  getAdminAiConfig,
  updateAdminAiConfig,
  testAiConnection,
  getUserSessions,
  createSession,
  deleteSession,
  getSessionMessages,
  sendMessage,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

/* Public Bot Info */
aiRouter.get("/info", getPublicAiInfo);

/* User Chat Endpoints (Gated by Subscription: rbf_ai) */
aiRouter.get("/sessions", requireSubscription("rbf_ai"), getUserSessions);
aiRouter.post("/sessions", requireSubscription("rbf_ai"), createSession);
aiRouter.delete("/sessions/:id", requireSubscription("rbf_ai"), deleteSession);
aiRouter.get("/sessions/:id/messages", requireSubscription("rbf_ai"), getSessionMessages);
aiRouter.post("/chat", requireSubscription("rbf_ai"), sendMessage);

/* Admin Configuration Endpoints with Granular RBAC */
aiRouter.get("/admin/config", isAdmin, authorize(["ai_config.view", "ai_config.manage"]), getAdminAiConfig);
aiRouter.put("/admin/config", isAdmin, authorize("ai_config.manage"), updateAdminAiConfig);
aiRouter.post("/admin/test", isAdmin, authorize("ai_config.manage"), testAiConnection);

export default aiRouter;
