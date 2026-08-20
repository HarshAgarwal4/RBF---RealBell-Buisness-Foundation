import crypto from "crypto";
import LiveSessionModel from "../models/liveSession.js";
import QueueEntryModel from "../models/queueEntry.js";
import Organization from "../models/organization.js";
import {
  joinQueue,
  leaveQueue,
  getQueue,
  getCurrentParticipant,
  admitParticipant,
  startConsultation,
  endConsultation,
  getNextParticipant,
  rejectParticipant,
  toggleQueuePause,
  recalculateQueue,
  getSessionAnalytics,
} from "../../services/queueService.js";
import { getVideoProvider } from "../../services/videoProvider.js";
import { getIO } from "../../services/socket.js";
import { clearSessionRedis } from "../../services/liveSessionRedis.js";

/**
 * Helper to emit socket events
 */
function emitSessionEvent(sessionId, event, data) {
  try {
    const io = getIO();
    if (io && sessionId) {
      io.to(`live-session:${String(sessionId)}`).emit(event, data);
    }
  } catch (err) {
    console.error("Socket emit error:", err);
  }
}

/**
 * POST /live-sessions
 * Create a new live session
 */
export async function createLiveSession(req, res) {
  try {
    const {
      title,
      description = "",
      sessionType = "one-to-one",
      scheduledAt,
      maxQueueSize = 20,
      maxConsultationDuration = 15,
      averageConsultationDuration = 10,
      autoNextParticipant = false,
      videoProvider = "in-built-webrtc",
      isPasswordProtected = false,
      passcode = "",
      visibility = "public",
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 0, msg: "Session title is required" });
    }

    const videoRoomId = `rbf_room_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const session = await LiveSessionModel.create({
      hostId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      sessionType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: "SCHEDULED",
      maxQueueSize: Number(maxQueueSize) || 20,
      maxConsultationDuration: Number(maxConsultationDuration) || 15,
      averageConsultationDuration: Number(averageConsultationDuration) || 10,
      autoNextParticipant: Boolean(autoNextParticipant),
      videoProvider,
      videoRoomId,
      isPasswordProtected: Boolean(isPasswordProtected),
      passcode: isPasswordProtected && passcode ? String(passcode).trim() : "",
      visibility: visibility === "private" ? "private" : "public",
    });

    res.status(201).json({
      status: 1,
      msg: "Live session created successfully",
      session,
    });
  } catch (err) {
    console.error("createLiveSession error:", err);
    res.status(500).json({ status: 0, msg: err.message || "Failed to create live session" });
  }
}

/**
 * GET /live-sessions
 * List all active and scheduled live sessions
 */
export async function getLiveSessions(req, res) {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    } else {
      filter.status = { $in: ["LIVE", "SCHEDULED", "PAUSED"] };
    }

    if (type) {
      filter.sessionType = type;
    }

    // Public sessions visible to all; Private sessions only visible to the host
    const visibilityFilter = {
      $or: [
        { visibility: "public" },
        { visibility: { $exists: false } },
        ...(req.user?._id ? [{ hostId: req.user._id }] : []),
      ],
    };
    filter.$and = [visibilityFilter];

    const sessions = await LiveSessionModel.find(filter)
      .populate("hostId", "name company_name email account profile")
      .populate("currentParticipantId", "name company_name account")
      .sort({ status: 1, scheduledAt: -1, createdAt: -1 });

    // Attach active waiting counts
    const sessionIds = sessions.map((s) => s._id);
    const waitingCounts = await QueueEntryModel.aggregate([
      { $match: { sessionId: { $in: sessionIds }, status: "WAITING" } },
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    waitingCounts.forEach((c) => countMap.set(String(c._id), c.count));

    const enrichedSessions = sessions.map((s) => ({
      ...s.toObject(),
      waitingCount: countMap.get(String(s._id)) || 0,
    }));

    res.status(200).json({
      status: 1,
      sessions: enrichedSessions,
    });
  } catch (err) {
    console.error("getLiveSessions error:", err);
    res.status(500).json({ status: 0, msg: "Failed to fetch live sessions" });
  }
}

/**
 * GET /live-sessions/my-sessions
 * List sessions created by the logged-in host
 */
export async function getMyLiveSessions(req, res) {
  try {
    const sessions = await LiveSessionModel.find({ hostId: req.user._id })
      .populate("currentParticipantId", "name company_name account")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 1,
      sessions,
    });
  } catch (err) {
    console.error("getMyLiveSessions error:", err);
    res.status(500).json({ status: 0, msg: "Failed to fetch your sessions" });
  }
}

/**
 * GET /live-sessions/:id
 * Get single session details + user's current queue status
 */
export async function getLiveSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id)
      .populate("hostId", "name company_name email account profile")
      .populate("currentParticipantId", "name company_name email account profile")
      .populate("currentQueueEntryId");

    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    const isHost = String(session.hostId._id) === String(req.user._id);

    // Get current user's active queue entry in this session
    const myQueueEntry = await QueueEntryModel.findOne({
      sessionId: id,
      userId: req.user._id,
      status: { $in: ["WAITING", "ADMITTED", "IN_CALL"] },
    });

    const waitingCount = await QueueEntryModel.countDocuments({
      sessionId: id,
      status: "WAITING",
    });

    // If not host, hide the raw passcode from the payload
    const sessionData = session.toObject();
    if (!isHost && sessionData.isPasswordProtected) {
      delete sessionData.passcode;
    }

    res.status(200).json({
      status: 1,
      session: sessionData,
      isHost,
      myQueueEntry,
      waitingCount,
    });
  } catch (err) {
    console.error("getLiveSessionById error:", err);
    res.status(500).json({ status: 0, msg: "Failed to fetch session details" });
  }
}

/**
 * PATCH /live-sessions/:id/start
 * Host starts the session
 */
export async function startLiveSession(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (String(session.hostId) !== String(req.user._id) && req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ status: 0, msg: "Unauthorized" });
    }

    session.status = "LIVE";
    if (!session.startedAt) {
      session.startedAt = new Date();
    }
    session.queuePaused = false;
    await session.save();

    emitSessionEvent(id, "session:started", {
      sessionId: String(id),
      status: "LIVE",
      startedAt: session.startedAt,
    });

    res.status(200).json({
      status: 1,
      msg: "Session started successfully",
      session,
    });
  } catch (err) {
    console.error("startLiveSession error:", err);
    res.status(500).json({ status: 0, msg: err.message });
  }
}

/**
 * PATCH /live-sessions/:id/pause
 * Host pauses session / queue
 */
export async function pauseLiveSession(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (String(session.hostId) !== String(req.user._id)) {
      return res.status(403).json({ status: 0, msg: "Unauthorized" });
    }

    session.status = "PAUSED";
    session.pausedAt = new Date();
    session.queuePaused = true;
    await session.save();

    emitSessionEvent(id, "session:paused", {
      sessionId: String(id),
      status: "PAUSED",
    });

    res.status(200).json({
      status: 1,
      msg: "Session paused",
      session,
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
}

/**
 * PATCH /live-sessions/:id/resume
 * Host resumes session
 */
export async function resumeLiveSession(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (String(session.hostId) !== String(req.user._id)) {
      return res.status(403).json({ status: 0, msg: "Unauthorized" });
    }

    session.status = "LIVE";
    session.queuePaused = false;
    await session.save();

    emitSessionEvent(id, "session:resumed", {
      sessionId: String(id),
      status: "LIVE",
    });

    res.status(200).json({
      status: 1,
      msg: "Session resumed",
      session,
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
}

/**
 * PATCH /live-sessions/:id/end
 * Host ends session
 */
export async function endLiveSession(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    const isHost = String(session.hostId) === String(req.user._id);
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

    if (!isHost && !isAdmin) {
      return res.status(403).json({ status: 0, msg: "Unauthorized" });
    }

    session.status = "ENDED";
    session.endedAt = new Date();
    session.currentParticipantId = null;
    session.currentQueueEntryId = null;
    await session.save();

    // Cancel remaining waiting entries
    await QueueEntryModel.updateMany(
      { sessionId: id, status: { $in: ["WAITING", "ADMITTED"] } },
      {
        $set: {
          status: "CANCELLED",
          cancellationTime: new Date(),
          cancellationReason: "Session ended by host",
        },
      }
    );

    emitSessionEvent(id, "session:ended", {
      sessionId: String(id),
      status: "ENDED",
      endedAt: session.endedAt,
    });

    res.status(200).json({
      status: 1,
      msg: "Session ended successfully",
      session,
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
}

/**
 * POST /live-sessions/:id/verify-passcode
 * Verify meeting passcode for password-protected sessions
 */
export async function verifySessionPasscode(req, res) {
  try {
    const { id } = req.params;
    const { passcode = "" } = req.body || {};
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    if (!session.isPasswordProtected) {
      return res.status(200).json({ status: 1, valid: true, msg: "No passcode required" });
    }

    const isHost = String(session.hostId) === String(req.user._id);
    if (isHost || String(session.passcode).trim() === String(passcode).trim()) {
      return res.status(200).json({ status: 1, valid: true, msg: "Passcode verified" });
    }

    return res.status(400).json({ status: 0, valid: false, msg: "Incorrect meeting passcode" });
  } catch (err) {
    console.error("verifySessionPasscode error:", err);
    res.status(500).json({ status: 0, msg: err.message || "Failed to verify passcode" });
  }
}

/**
 * DELETE /live-sessions/:id
 * Delete a live session (host or admin only)
 */
export async function deleteLiveSession(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id);

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    const isHost = String(session.hostId) === String(req.user._id);
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

    if (!isHost && !isAdmin) {
      return res.status(403).json({
        status: 0,
        msg: "Unauthorized: Only the host or admin can delete this session",
      });
    }

    // Cancel all active queue entries
    await QueueEntryModel.updateMany(
      { sessionId: id, status: { $in: ["WAITING", "ADMITTED", "IN_CALL"] } },
      { $set: { status: "CANCELLED", rejectionReason: "Session was deleted by host" } }
    );

    // Delete the session
    await LiveSessionModel.findByIdAndDelete(id);

    // Clear Redis session cache
    await clearSessionRedis(id);

    // Notify room listeners in real time
    emitSessionEvent(id, "session:deleted", {
      sessionId: String(id),
      msg: "This live session has been deleted by the host.",
    });
    emitSessionEvent(id, "session:ended", {
      sessionId: String(id),
    });

    res.status(200).json({
      status: 1,
      msg: "Live session deleted successfully",
    });
  } catch (err) {
    console.error("deleteLiveSession error:", err);
    res.status(500).json({ status: 0, msg: err.message || "Failed to delete live session" });
  }
}

/**
 * POST /live-sessions/:id/queue
 * User joins the waiting queue
 */
export async function joinSessionQueue(req, res) {
  try {
    const { id } = req.params;
    const { priority = 0, passcode = "" } = req.body || {};

    const session = await LiveSessionModel.findById(id);
    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    const isHost = String(session.hostId) === String(req.user._id);

    // Validate passcode if password protected
    if (session.isPasswordProtected && !isHost) {
      if (String(session.passcode).trim() !== String(passcode).trim()) {
        return res.status(401).json({ status: 0, msg: "Invalid or missing meeting passcode" });
      }
    }

    const result = await joinQueue(id, req.user._id, priority);

    res.status(200).json({
      status: 1,
      msg: result.alreadyInQueue
        ? "You are already in this queue"
        : "Joined waiting queue successfully",
      ...result,
    });
  } catch (err) {
    console.error("joinSessionQueue error:", err);
    res.status(400).json({ status: 0, msg: err.message || "Failed to join queue" });
  }
}

/**
 * DELETE /live-sessions/:id/queue
 * User leaves / cancels their queue entry
 */
export async function leaveSessionQueue(req, res) {
  try {
    const { id } = req.params;
    const { reason = "User left queue" } = req.body || {};

    const result = await leaveQueue(id, req.user._id, reason);

    res.status(200).json({
      status: 1,
      msg: "Left queue successfully",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ status: 0, msg: err.message || "Failed to leave queue" });
  }
}

/**
 * GET /live-sessions/:id/queue
 * Get waiting queue list for session
 */
export async function getSessionQueue(req, res) {
  try {
    const { id } = req.params;
    const queue = await getQueue(id);
    const { currentParticipant, currentQueueEntry } = await getCurrentParticipant(id);

    res.status(200).json({
      status: 1,
      queue,
      currentParticipant,
      currentQueueEntry,
      waitingCount: queue.length,
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: "Failed to fetch queue" });
  }
}

/**
 * POST /live-sessions/:id/queue/:entryId/admit
 * Host admits a participant
 */
export async function admitParticipantController(req, res) {
  try {
    const { id, entryId } = req.params;
    const result = await admitParticipant(id, req.user._id, entryId);

    res.status(200).json({
      status: 1,
      msg: "Participant admitted successfully",
      ...result,
    });
  } catch (err) {
    console.error("admitParticipantController error:", err);
    res.status(400).json({ status: 0, msg: err.message || "Failed to admit participant" });
  }
}

/**
 * POST /live-sessions/:id/queue/:entryId/reject
 * Host rejects a participant
 */
export async function rejectParticipantController(req, res) {
  try {
    const { id, entryId } = req.params;
    const { reason = "Rejected by host" } = req.body || {};

    const result = await rejectParticipant(id, req.user._id, entryId, reason);

    res.status(200).json({
      status: 1,
      msg: "Participant rejected",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ status: 0, msg: err.message || "Failed to reject participant" });
  }
}

/**
 * POST /live-sessions/:id/consultation/end
 * Host ends current consultation
 */
export async function endConsultationController(req, res) {
  try {
    const { id } = req.params;
    const { entryId } = req.body || {};

    const result = await endConsultation(id, req.user._id, entryId);

    res.status(200).json({
      status: 1,
      msg: "Consultation ended",
      ...result,
    });
  } catch (err) {
    console.error("endConsultationController error:", err);
    res.status(400).json({ status: 0, msg: err.message || "Failed to end consultation" });
  }
}

/**
 * POST /live-sessions/:id/next
 * Host moves to next participant
 */
export async function nextParticipantController(req, res) {
  try {
    const { id } = req.params;
    const result = await getNextParticipant(id, req.user._id);

    res.status(200).json({
      status: 1,
      msg: result.nextEntry ? "Moved to next participant" : "Queue is empty",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ status: 0, msg: err.message || "Failed to get next participant" });
  }
}

/**
 * PATCH /live-sessions/:id/queue-pause
 * Pause / resume queue
 */
export async function toggleQueuePauseController(req, res) {
  try {
    const { id } = req.params;
    const { pause = true } = req.body || {};

    const result = await toggleQueuePause(id, req.user._id, pause);

    res.status(200).json({
      status: 1,
      msg: pause ? "Queue paused" : "Queue resumed",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ status: 0, msg: err.message });
  }
}

/**
 * GET /live-sessions/:id/call-access
 * Generate video room grant after strict access verification
 */
export async function getCallAccessGrant(req, res) {
  try {
    const { id } = req.params;
    const session = await LiveSessionModel.findById(id).populate("hostId", "name email company_name account profile");

    if (!session) return res.status(404).json({ status: 0, msg: "Session not found" });

    const isHost = String(session.hostId?._id || session.hostId) === String(req.user._id);
    let queueEntry = null;

    if (!isHost) {
      if (session.sessionType === "group") {
        // For group sessions, all authorized attendees can enter the group call room
      } else {
        queueEntry = await QueueEntryModel.findOne({
          sessionId: id,
          userId: req.user._id,
          status: { $in: ["ADMITTED", "IN_CALL"] },
        }).populate("userId", "name email company_name account profile");

        if (!queueEntry) {
          return res.status(403).json({
            status: 0,
            msg: "Access denied. You have not been admitted by the host to enter this call.",
          });
        }

        // Mark consultation started if not already
        if (queueEntry.status === "ADMITTED") {
          await startConsultation(id, req.user._id);
        }
      }
    }

    // Find active in-call participant for host view (1-to-1)
    const activeParticipantEntry = await QueueEntryModel.findOne({
      sessionId: id,
      status: { $in: ["IN_CALL", "ADMITTED"] },
    }).populate("userId", "name email company_name account profile");

    const provider = getVideoProvider(session.videoProvider);
    const grant = await provider.generateAccessGrant(session, req.user, queueEntry);

    res.status(200).json({
      status: 1,
      grant,
      isHost,
      peerInfo: isHost ? activeParticipantEntry?.userId : session.hostId,
      session: {
        _id: session._id,
        title: session.title,
        hostId: session.hostId,
        videoRoomId: session.videoRoomId,
        videoProvider: session.videoProvider,
        sessionType: session.sessionType || "one-to-one",
        maxConsultationDuration: session.maxConsultationDuration,
      },
    });
  } catch (err) {
    console.error("getCallAccessGrant error:", err);
    res.status(500).json({ status: 0, msg: err.message || "Failed to generate call access" });
  }
}

/**
 * GET /live-sessions/:id/analytics
 * Get detailed session statistics
 */
export async function getSessionAnalyticsController(req, res) {
  try {
    const { id } = req.params;
    const data = await getSessionAnalytics(id);

    res.status(200).json({
      status: 1,
      ...data,
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message || "Failed to fetch analytics" });
  }
}

/**
 * GET /live-sessions/connections
 * Get user's accepted connections for direct invitations
 */
export async function getLiveSessionConnections(req, res) {
  try {
    const org = await Organization.findById(req.user._id).populate(
      "connections.with",
      "name company_name email account profile"
    );

    if (!org) {
      return res.status(404).json({ status: 0, msg: "Organization not found" });
    }

    const connections = (org.connections || [])
      .filter((c) => c.status === "accepted" && c.with)
      .map((c) => c.with);

    res.status(200).json({
      status: 1,
      connections,
    });
  } catch (error) {
    console.error("getLiveSessionConnections error:", error);
    res.status(500).json({ status: 0, msg: "Failed to fetch connections", error: error.message });
  }
}

/**
 * POST /live-sessions/:id/invite
 * Send real-time socket invitation to selected connections
 */
export async function inviteConnectionsToSession(req, res) {
  try {
    const { id } = req.params;
    const { recipientUserIds = [] } = req.body || {};

    if (!Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
      return res.status(400).json({ status: 0, msg: "Please select at least one connection to invite" });
    }

    const session = await LiveSessionModel.findById(id).populate("hostId", "name company_name account profile");
    if (!session) {
      return res.status(404).json({ status: 0, msg: "Session not found" });
    }

    if (String(session.hostId._id) !== String(req.user._id)) {
      return res.status(403).json({ status: 0, msg: "Only the session host can send official meeting invites" });
    }

    const io = getIO();
    const invitePayload = {
      sessionId: String(session._id),
      sessionTitle: session.title,
      hostName: session.hostId?.name || "Host",
      hostCompany: session.hostId?.company_name || "",
      hostAvatar: session.hostId?.account?.image || session.hostId?.profile?.logo || "",
      passcode: session.isPasswordProtected ? session.passcode : "",
      isPasswordProtected: Boolean(session.isPasswordProtected),
      sessionType: session.sessionType,
      visibility: session.visibility || "public",
      invitedAt: new Date().toISOString(),
    };

    recipientUserIds.forEach((recipientId) => {
      if (io) {
        io.to(`user:${String(recipientId)}`).emit("liveSession:invite", invitePayload);
      }
    });

    res.status(200).json({
      status: 1,
      msg: `Invitation sent to ${recipientUserIds.length} connection(s) successfully`,
      invitedCount: recipientUserIds.length,
    });
  } catch (err) {
    console.error("inviteConnectionsToSession error:", err);
    res.status(500).json({ status: 0, msg: "Failed to send session invites" });
  }
}
