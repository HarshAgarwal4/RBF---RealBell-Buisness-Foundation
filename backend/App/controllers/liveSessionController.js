import LiveSessionModel from "../models/liveSession.js";
import OrganizationModel from "../models/organization.js";
import mongoose from "mongoose";
import {
  setSessionActiveConsultation,
  clearSessionActiveConsultation,
  incrementSessionStats,
  setQueuePausedState,
} from "../../services/liveSessionRedis.js";
import { getIO } from "../../services/socket.js";

/**
 * GET /live-sessions
 * List active sessions
 */
export async function getLiveSessions(req, res) {
  try {
    const { search = "", tab = "all" } = req.query;
    const userId = req.user?._id;

    let query = { status: { $in: ["live", "scheduled"] } };

    if (tab === "mine") {
      if (!userId) {
        return res.status(200).json({ status: 1, sessions: [] });
      }
      query.host = userId;
    } else {
      if (userId) {
        // Fetch user's accepted connections
        const userOrg = await OrganizationModel.findById(userId).select("connections");
        const acceptedConnectionIds = (userOrg?.connections || [])
          .filter((c) => c.status === "accepted")
          .map((c) => c.with);

        query.$or = [
          { visibility: "public" },
          { host: userId },
          {
            visibility: "private",
            visibleToConnections: true,
            host: { $in: acceptedConnectionIds },
          },
        ];
      } else {
        query.visibility = "public";
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchConditions = [
        { title: searchRegex },
        { description: searchRegex },
      ];

      if (query.$or) {
        query = {
          $and: [
            { $or: query.$or },
            { $or: searchConditions },
            { status: query.status }
          ]
        };
      } else {
        query.$or = searchConditions;
      }
    }

    const sessions = await LiveSessionModel.find(query)
      .populate("host", "name company_name company_type account")
      .populate("activeConsultation.user", "name company_name company_type account")
      .populate("queue.user", "name company_name company_type account")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 1,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to fetch live sessions",
      error: error.message,
    });
  }
}

/**
 * GET /live-sessions/:id
 * Get details for a single live session
 */
export async function getLiveSessionById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid session ID" });
    }

    const session = await LiveSessionModel.findById(id)
      .populate("host", "name company_name company_type account")
      .populate("activeConsultation.user", "name company_name company_type account")
      .populate("queue.user", "name company_name company_type account");

    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    return res.status(200).json({
      status: 1,
      session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to fetch session",
      error: error.message,
    });
  }
}

/**
 * POST /live-sessions
 * Create a new live session & queue
 */
export async function createLiveSession(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ status: 0, msg: "Unauthorized" });
    }

    const {
      title,
      description = "",
      maxQueueSize = 20,
      avgConsultationMins = 10,
      maxDurationLimitMins = 15,
      sessionFormat = "1-to-1 Queue",
      visibility = "public",
      visibleToConnections = false,
      requirePasscode = false,
      passcode = "",
      autoAdmit = true,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 0,
        msg: "Session Title is required",
      });
    }

    if (requirePasscode && !passcode.trim()) {
      return res.status(400).json({
        status: 0,
        msg: "Please provide a meeting passcode when passcode protection is enabled",
      });
    }

    const validFormat = sessionFormat === "Group Call" ? "Group Call" : "1-to-1 Queue";

    const newSession = new LiveSessionModel({
      title: title.trim(),
      description: description.trim(),
      host: userId,
      maxQueueSize: Number(maxQueueSize) || 20,
      avgConsultationMins: Number(avgConsultationMins) || 10,
      maxDurationLimitMins: Number(maxDurationLimitMins) || 15,
      sessionFormat: validFormat,
      visibility: visibility === "private" ? "private" : "public",
      visibleToConnections: visibility === "private" ? Boolean(visibleToConnections) : false,
      requirePasscode: Boolean(requirePasscode),
      passcode: requirePasscode ? passcode.trim() : "",
      autoAdmit: Boolean(autoAdmit),
      isPaused: false,
      status: "live",
      activeConsultation: { user: null, startedAt: null },
      stats: { completedCount: 0, totalAdmittedCount: 0 },
      queue: [],
    });

    await newSession.save();
    await newSession.populate("host", "name company_name company_type account");

    return res.status(201).json({
      status: 1,
      msg: "Live Session created successfully",
      session: newSession,
    });
  } catch (error) {
    console.error("Error creating live session:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to create live session",
      error: error.message,
    });
  }
}

/**
 * DELETE /live-sessions/:id
 * End & delete a live session
 */
export async function deleteLiveSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid session ID" });
    }

    const session = await LiveSessionModel.findById(id);
    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    const isHost = session.host.toString() === userId?.toString();
    const isAdmin = req.user?.role === "admin" || req.user?.role === "super_admin";

    if (!isHost && !isAdmin) {
      return res.status(403).json({
        status: 0,
        msg: "You are not authorized to delete this session",
      });
    }

    await LiveSessionModel.findByIdAndDelete(id);
    await clearSessionActiveConsultation(id);

    const io = getIO();
    if (io) {
      io.to(`live_session:${id}`).emit("live-session:ended", { sessionId: id });
    }

    return res.status(200).json({
      status: 1,
      msg: "Live session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting live session:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to delete session",
      error: error.message,
    });
  }
}

/**
 * POST /live-sessions/:id/join-queue
 */
export async function joinQueue(req, res) {
  try {
    const { id } = req.params;
    const { passcode = "" } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ status: 0, msg: "Unauthorized" });
    }

    const session = await LiveSessionModel.findById(id);
    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    if (session.status !== "live") {
      return res.status(400).json({ status: 0, msg: "This session is no longer active" });
    }

    if (session.isPaused) {
      return res.status(400).json({ status: 0, msg: "Queue is currently paused by host" });
    }

    if (session.requirePasscode && session.host.toString() !== userId.toString()) {
      if (passcode.trim() !== session.passcode.trim()) {
        return res.status(403).json({ status: 0, msg: "Invalid meeting passcode" });
      }
    }

    const activeWaiting = session.queue.filter((q) => q.status === "waiting");
    if (activeWaiting.length >= session.maxQueueSize) {
      return res.status(400).json({ status: 0, msg: "Waiting queue is currently full" });
    }

    const existingIndex = session.queue.findIndex(
      (q) => String(q.user?._id || q.user) === String(userId)
    );

    if (existingIndex === -1) {
      session.queue.push({
        user: userId,
        joinedAt: new Date(),
        status: "waiting",
      });
    } else {
      session.queue[existingIndex].status = "waiting";
      session.queue[existingIndex].joinedAt = new Date();
    }
    await session.save();

    const updated = await LiveSessionModel.findById(id)
      .populate("host", "name company_name company_type account email")
      .populate("activeConsultation.user", "name company_name company_type account email")
      .populate("queue.user", "name company_name company_type account email");

    const io = getIO();
    if (io) {
      io.to(`live_session:${id}`).emit("live-session:queue:updated", {
        queue: updated.queue,
        stats: updated.stats,
      });
      io.to(`live_session:${id}`).emit("live-session:state:updated", {
        session: updated,
      });
    }

    return res.status(200).json({
      status: 1,
      msg: "Joined waiting queue successfully",
      session: updated,
    });
  } catch (error) {
    console.error("Error joining queue:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to join queue",
      error: error.message,
    });
  }
}

/**
 * POST /live-sessions/:id/leave-queue
 */
export async function leaveQueue(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ status: 0, msg: "Unauthorized" });
    }

    const session = await LiveSessionModel.findById(id);
    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    session.queue = session.queue.filter(
      (q) => String(q.user?._id || q.user) !== String(userId)
    );

    await session.save();

    const updated = await LiveSessionModel.findById(id)
      .populate("host", "name company_name company_type account email")
      .populate("activeConsultation.user", "name company_name company_type account email")
      .populate("queue.user", "name company_name company_type account email");

    const io = getIO();
    if (io) {
      io.to(`live_session:${id}`).emit("live-session:queue:updated", {
        queue: updated.queue,
        stats: updated.stats,
      });
      io.to(`live_session:${id}`).emit("live-session:state:updated", {
        session: updated,
      });
    }

    return res.status(200).json({
      status: 1,
      msg: "Left waiting queue",
      session: updated,
    });
  } catch (error) {
    console.error("Error leaving queue:", error);
    return res.status(500).json({
      status: 0,
      msg: "Failed to leave queue",
      error: error.message,
    });
  }
}

/**
 * POST /live-sessions/:id/admit
 * Host admits participant into consultation
 */
export async function admitParticipant(req, res) {
  try {
    const { id } = req.params;
    const { participantId } = req.body;
    const userId = req.user?._id;

    const session = await LiveSessionModel.findById(id);
    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ status: 0, msg: "Only the host can admit participants" });
    }

    const qItem = session.queue.find((q) => q.user.toString() === participantId.toString());
    if (qItem) {
      qItem.status = "in_consultation";
    }

    session.activeConsultation = {
      user: participantId,
      startedAt: new Date(),
    };
    session.stats.totalAdmittedCount = (session.stats.totalAdmittedCount || 0) + 1;

    await session.save();
    await setSessionActiveConsultation(id, {
      userId: participantId,
      startedAt: new Date().toISOString(),
    });
    await incrementSessionStats(id, "totalAdmitted");

    const updated = await LiveSessionModel.findById(id)
      .populate("host", "name company_name company_type account")
      .populate("activeConsultation.user", "name company_name company_type account")
      .populate("queue.user", "name company_name company_type account");

    const io = getIO();
    if (io) {
      // 1. Notify participant directly in user channel
      io.to(`user:${participantId}`).emit("live-session:admitted", {
        sessionId: id,
        host: updated.host,
        session: updated,
      });

      // 2. Broadcast admit event to session room
      io.to(`live_session:${id}`).emit("live-session:admitted", {
        sessionId: id,
        participantId: String(participantId),
        host: updated.host,
        session: updated,
      });

      // 3. Broadcast full session state and queue updates
      io.to(`live_session:${id}`).emit("live-session:state:updated", {
        session: updated,
      });
      io.to(`live_session:${id}`).emit("live-session:queue:updated", {
        queue: updated.queue,
        stats: updated.stats,
      });
    }

    return res.status(200).json({
      status: 1,
      msg: "Participant admitted into consultation",
      session: updated,
    });
  } catch (error) {
    console.error("Error admitting participant:", error);
    return res.status(500).json({ status: 0, msg: error.message });
  }
}

/**
 * POST /live-sessions/:id/end-consultation
 */
export async function endConsultation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const session = await LiveSessionModel.findById(id);
    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ status: 0, msg: "Only the host can end consultations" });
    }

    const activeUser = session.activeConsultation?.user;
    if (activeUser) {
      const qItem = session.queue.find((q) => q.user.toString() === activeUser.toString());
      if (qItem) {
        qItem.status = "completed";
      }
      session.stats.completedCount = (session.stats.completedCount || 0) + 1;
      await incrementSessionStats(id, "completed");
    }

    session.activeConsultation = { user: null, startedAt: null };
    await clearSessionActiveConsultation(id);

    // If autoAdmit is enabled, admit the next waiting participant automatically
    let nextAdmitted = null;
    if (session.autoAdmit) {
      const nextInLine = session.queue.find((q) => q.status === "waiting");
      if (nextInLine) {
        nextInLine.status = "in_consultation";
        session.activeConsultation = {
          user: nextInLine.user,
          startedAt: new Date(),
        };
        session.stats.totalAdmittedCount = (session.stats.totalAdmittedCount || 0) + 1;
        nextAdmitted = nextInLine.user;
        await setSessionActiveConsultation(id, {
          userId: nextInLine.user,
          startedAt: new Date().toISOString(),
        });
        await incrementSessionStats(id, "totalAdmitted");
      }
    }

    await session.save();

    const updated = await LiveSessionModel.findById(id)
      .populate("host", "name company_name company_type account")
      .populate("activeConsultation.user", "name company_name company_type account")
      .populate("queue.user", "name company_name company_type account");

    const io = getIO();
    if (io) {
      if (activeUser) {
        io.to(`user:${activeUser}`).emit("live-session:consultation-ended", { sessionId: id });
      }
      if (nextAdmitted) {
        io.to(`user:${nextAdmitted}`).emit("live-session:admitted", {
          sessionId: id,
          host: updated.host,
          session: updated,
        });
      }
      io.to(`live_session:${id}`).emit("live-session:state:updated", {
        session: updated,
      });
    }

    return res.status(200).json({
      status: 1,
      msg: "Consultation ended",
      session: updated,
    });
  } catch (error) {
    console.error("Error ending consultation:", error);
    return res.status(500).json({ status: 0, msg: error.message });
  }
}

/**
 * POST /live-sessions/:id/pause-queue
 */
export async function togglePauseQueue(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const session = await LiveSessionModel.findById(id);
    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ status: 0, msg: "Only the host can toggle queue status" });
    }

    session.isPaused = !session.isPaused;
    await session.save();
    await setQueuePausedState(id, session.isPaused);

    const io = getIO();
    if (io) {
      io.to(`live_session:${id}`).emit("live-session:queue:paused", {
        isPaused: session.isPaused,
      });
    }

    return res.status(200).json({
      status: 1,
      msg: session.isPaused ? "Queue paused" : "Queue resumed",
      isPaused: session.isPaused,
    });
  } catch (error) {
    console.error("Error toggling pause queue:", error);
    return res.status(500).json({ status: 0, msg: error.message });
  }
}
