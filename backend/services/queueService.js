import LiveSessionModel from "../App/models/liveSession.js";
import QueueEntryModel from "../App/models/queueEntry.js";
import OrganizationModel from "../App/models/organization.js";
import { getIO } from "./socket.js";
import { getVideoProvider } from "./videoProvider.js";

const DISCONNECT_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
const disconnectTimers = new Map();

/**
 * Emit socket event helper with fallback safety
 */
function emitSessionEvent(sessionId, event, data) {
  try {
    const io = getIO();
    if (io && sessionId) {
      io.to(`live-session:${String(sessionId)}`).emit(event, data);
    }
  } catch (err) {
    console.error(`Socket broadcast error [${event}]:`, err);
  }
}

function getUserIdString(user) {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (user._id) return String(user._id);
  return String(user);
}

function emitUserEvent(userId, event, data) {
  try {
    const id = getUserIdString(userId);
    const io = getIO();
    if (io && id) {
      io.to(`user:${id}`).emit(event, data);
    }
  } catch (err) {
    console.error(`Socket user emit error [${event}]:`, err);
  }
}

/**
 * Recalculate deterministic FIFO positions and estimated wait times
 * for all WAITING entries in a session.
 */
export async function recalculateQueue(sessionId) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) return [];

  const avgDuration = session.averageConsultationDuration || 10;

  // Retrieve all waiting entries deterministically sorted: highest priority first, then earliest joinedAt
  const waitingEntries = await QueueEntryModel.find({
    sessionId,
    status: "WAITING",
  })
    .sort({ priority: -1, joinedAt: 1 })
    .populate("userId", "name company_name email account profile");

  const bulkOps = [];
  const updatedEntries = [];

  for (let index = 0; index < waitingEntries.length; index++) {
    const entry = waitingEntries[index];
    const newPosition = index + 1;
    const estimatedWaitTime = index * avgDuration;

    entry.position = newPosition;
    entry.estimatedWaitTime = estimatedWaitTime;
    updatedEntries.push(entry);

    bulkOps.push({
      updateOne: {
        filter: { _id: entry._id },
        update: {
          $set: {
            position: newPosition,
            estimatedWaitTime,
          },
        },
      },
    });

    // Notify individual user of their updated position
    const userIdStr = getUserIdString(entry.userId);
    if (userIdStr) {
      emitUserEvent(userIdStr, "queue:position-updated", {
        sessionId: String(sessionId),
        queueEntryId: String(entry._id),
        position: newPosition,
        usersAhead: index,
        estimatedWaitTime,
        status: "WAITING",
      });
    }
  }

  if (bulkOps.length > 0) {
    await QueueEntryModel.bulkWrite(bulkOps);
  }

  // Broadcast overall queue update to host and room listeners
  emitSessionEvent(sessionId, "queue:update", {
    sessionId: String(sessionId),
    waitingCount: updatedEntries.length,
    queue: updatedEntries,
  });

  return updatedEntries;
}

/**
 * Join Waiting Queue
 * Protected against race conditions and duplicates
 */
export async function joinQueue(sessionId, userId, priority = 0) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "LIVE") {
    if (session.status === "SCHEDULED") {
      throw new Error("Session has not started yet.");
    }
    if (session.status === "ENDED" || session.status === "CANCELLED") {
      throw new Error("Session has already ended.");
    }
    throw new Error(`Session is currently ${session.status.toLowerCase()}.`);
  }

  if (session.queuePaused) {
    throw new Error("The waiting queue is currently paused by the host.");
  }

  if (String(session.hostId) === String(userId)) {
    throw new Error("Host cannot join their own waiting queue.");
  }

  // Clear any existing disconnect grace timer
  if (disconnectTimers.has(String(userId))) {
    clearTimeout(disconnectTimers.get(String(userId)));
    disconnectTimers.delete(String(userId));
  }

  // Check if user already has an active entry in this session
  const existingActive = await QueueEntryModel.findOne({
    sessionId,
    userId,
    status: { $in: ["WAITING", "ADMITTED", "IN_CALL"] },
  });

  if (existingActive) {
    return {
      entry: existingActive,
      alreadyInQueue: true,
      position: existingActive.position,
      status: existingActive.status,
    };
  }

  // Atomic queue capacity validation
  const currentWaitingCount = await QueueEntryModel.countDocuments({
    sessionId,
    status: "WAITING",
  });

  if (currentWaitingCount >= session.maxQueueSize) {
    throw new Error("Queue is currently full. Please try again later.");
  }

  // Create new queue entry
  const entry = await QueueEntryModel.create({
    sessionId,
    userId,
    priority: Number(priority) || 0,
    status: "WAITING",
    joinedAt: new Date(),
  });

  // Increment session total joined
  await LiveSessionModel.findByIdAndUpdate(sessionId, {
    $inc: { "stats.totalJoined": 1 },
  });

  // Recalculate positions atomically
  const updatedQueue = await recalculateQueue(sessionId);
  const myUpdated = updatedQueue.find(
    (e) => String(e._id) === String(entry._id)
  ) || entry;

  return {
    entry: myUpdated,
    alreadyInQueue: false,
    position: myUpdated.position,
    estimatedWaitTime: myUpdated.estimatedWaitTime,
    status: "WAITING",
  };
}

/**
 * Leave / Cancel Queue Entry
 */
export async function leaveQueue(sessionId, userId, reason = "User left queue") {
  const entry = await QueueEntryModel.findOneAndUpdate(
    {
      sessionId,
      userId,
      status: { $in: ["WAITING", "ADMITTED"] },
    },
    {
      $set: {
        status: "CANCELLED",
        cancellationTime: new Date(),
        cancellationReason: reason,
      },
    },
    { new: true }
  );

  if (!entry) {
    return { success: false, message: "No active queue entry found" };
  }

  // Update session stats
  await LiveSessionModel.findByIdAndUpdate(sessionId, {
    $inc: { "stats.totalCancelled": 1 },
  });

  // Recalculate remaining waiting participants
  await recalculateQueue(sessionId);

  emitUserEvent(userId, "queue:position-updated", {
    sessionId: String(sessionId),
    status: "CANCELLED",
    reason,
  });

  return { success: true, entry };
}

/**
 * Get current Queue for a session (Host / Admin / Room)
 */
export async function getQueue(sessionId) {
  return await QueueEntryModel.find({
    sessionId,
    status: "WAITING",
  })
    .sort({ position: 1, priority: -1, joinedAt: 1 })
    .populate("userId", "name company_name email account profile");
}

/**
 * Get current active participant in consultation
 */
export async function getCurrentParticipant(sessionId) {
  const session = await LiveSessionModel.findById(sessionId)
    .populate("currentParticipantId", "name company_name email account profile")
    .populate("currentQueueEntryId");

  return {
    currentParticipant: session?.currentParticipantId || null,
    currentQueueEntry: session?.currentQueueEntryId || null,
    status: session?.status,
  };
}

/**
 * Admit a participant from the queue
 */
export async function admitParticipant(sessionId, hostId, entryId) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const isHost = String(session.hostId) === String(hostId);
  if (!isHost) {
    throw new Error("Unauthorized: Only the host can admit participants");
  }

  // Check if another consultation is actively in progress
  if (session.currentParticipantId && session.currentQueueEntryId) {
    const activeEntry = await QueueEntryModel.findById(session.currentQueueEntryId);
    if (activeEntry && (activeEntry.status === "ADMITTED" || activeEntry.status === "IN_CALL")) {
      throw new Error("A consultation is currently in progress. Please end it before admitting another participant.");
    }
  }

  const entry = await QueueEntryModel.findOneAndUpdate(
    { _id: entryId, sessionId, status: "WAITING" },
    {
      $set: {
        status: "ADMITTED",
        admittedAt: new Date(),
      },
    },
    { new: true }
  ).populate("userId", "name company_name email account profile");

  if (!entry) {
    throw new Error("Queue entry not found or is no longer waiting");
  }

  // Update session
  const admittedUserId = entry.userId?._id || entry.userId;
  session.currentParticipantId = admittedUserId;
  session.currentQueueEntryId = entry._id;
  session.stats.totalAdmitted = (session.stats.totalAdmitted || 0) + 1;
  await session.save();

  // Generate video room grant
  const videoProvider = getVideoProvider(session.videoProvider);
  const grant = await videoProvider.generateAccessGrant(session, entry.userId || { _id: admittedUserId }, entry);

  // Recalculate remaining waiting queue
  await recalculateQueue(sessionId);

  // Notify the admitted user directly via socket
  const userIdStr = getUserIdString(admittedUserId);
  if (userIdStr) {
    emitUserEvent(userIdStr, "participant:admitted", {
      sessionId: String(sessionId),
      queueEntryId: String(entry._id),
      videoRoomId: session.videoRoomId,
      grant,
      admittedAt: entry.admittedAt,
      maxDurationMinutes: session.maxConsultationDuration,
    });
  }

  // Notify host and session listeners
  emitSessionEvent(sessionId, "participant:admitted", {
    sessionId: String(sessionId),
    participant: entry.userId,
    queueEntryId: String(entry._id),
  });

  return { success: true, entry, grant };
}

/**
 * Start Consultation (mark status IN_CALL)
 */
export async function startConsultation(sessionId, userId) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const entry = await QueueEntryModel.findOneAndUpdate(
    {
      sessionId,
      userId,
      status: { $in: ["ADMITTED", "IN_CALL"] },
    },
    {
      $set: {
        status: "IN_CALL",
        consultationStartedAt: new Date(),
      },
    },
    { new: true }
  ).populate("userId", "name company_name email account profile");

  if (entry) {
    emitSessionEvent(sessionId, "consultation:started", {
      sessionId: String(sessionId),
      participant: entry.userId,
      startedAt: entry.consultationStartedAt,
    });
  }

  return { success: true, entry };
}

/**
 * End Current Consultation
 */
export async function endConsultation(sessionId, hostId, entryId = null) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const isHost = String(session.hostId) === String(hostId);
  if (!isHost) {
    throw new Error("Unauthorized: Only host can end consultation");
  }

  const targetEntryId = entryId || session.currentQueueEntryId;
  let completedEntry = null;

  if (targetEntryId) {
    const entry = await QueueEntryModel.findById(targetEntryId);
    if (entry && (entry.status === "ADMITTED" || entry.status === "IN_CALL")) {
      const now = new Date();
      const startedAt = entry.consultationStartedAt || entry.admittedAt || now;
      const durationSec = Math.max(0, Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000));
      const waitTimeSec = entry.joinedAt
        ? Math.max(0, Math.round((new Date(entry.admittedAt || now).getTime() - new Date(entry.joinedAt).getTime()) / 1000))
        : 0;

      entry.status = "COMPLETED";
      entry.consultationEndedAt = now;
      await entry.save();
      completedEntry = entry;

      // Update session stats
      session.stats.totalCompleted = (session.stats.totalCompleted || 0) + 1;
      session.stats.totalConsultationTimeSec = (session.stats.totalConsultationTimeSec || 0) + durationSec;
      session.stats.totalWaitTimeSec = (session.stats.totalWaitTimeSec || 0) + waitTimeSec;

      // Notify the participant that consultation has ended
      emitUserEvent(String(entry.userId), "consultation:ended", {
        sessionId: String(sessionId),
        queueEntryId: String(entry._id),
        durationSec,
      });
    }
  }

  // Clear current participant on session
  session.currentParticipantId = null;
  session.currentQueueEntryId = null;
  await session.save();

  emitSessionEvent(sessionId, "consultation:ended", {
    sessionId: String(sessionId),
    completedEntryId: completedEntry ? String(completedEntry._id) : null,
  });

  // Auto-Next Participant if enabled
  let nextParticipant = null;
  if (session.autoNextParticipant && session.status === "LIVE" && !session.queuePaused) {
    try {
      const firstWaiting = await QueueEntryModel.findOne({
        sessionId,
        status: "WAITING",
      }).sort({ position: 1, priority: -1, joinedAt: 1 });

      if (firstWaiting) {
        const admitResult = await admitParticipant(sessionId, hostId, firstWaiting._id);
        nextParticipant = admitResult.entry;
      }
    } catch (autoErr) {
      console.error("Auto-next participant error:", autoErr);
    }
  }

  return {
    success: true,
    completedEntry,
    autoNextTriggered: !!nextParticipant,
    nextParticipant,
  };
}

/**
 * Move to Next Participant Manually
 */
export async function getNextParticipant(sessionId, hostId) {
  // First end current consultation if any
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  if (session.currentParticipantId || session.currentQueueEntryId) {
    await endConsultation(sessionId, hostId, session.currentQueueEntryId);
  }

  // Find next waiting participant
  const nextEntry = await QueueEntryModel.findOne({
    sessionId,
    status: "WAITING",
  }).sort({ position: 1, priority: -1, joinedAt: 1 });

  if (!nextEntry) {
    return { success: true, message: "Queue is empty", nextEntry: null };
  }

  const result = await admitParticipant(sessionId, hostId, nextEntry._id);
  return { success: true, nextEntry: result.entry, grant: result.grant };
}

/**
 * Reject / Remove Participant from Queue
 */
export async function rejectParticipant(sessionId, hostId, entryId, reason = "Rejected by host") {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  if (String(session.hostId) !== String(hostId)) {
    throw new Error("Unauthorized: Only host can reject participants");
  }

  const entry = await QueueEntryModel.findOneAndUpdate(
    { _id: entryId, sessionId },
    {
      $set: {
        status: "REJECTED",
        cancellationTime: new Date(),
        cancellationReason: reason,
      },
    },
    { new: true }
  ).populate("userId", "name email");

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  // If this entry was the current participant, clear it
  if (String(session.currentQueueEntryId) === String(entry._id)) {
    session.currentParticipantId = null;
    session.currentQueueEntryId = null;
  }

  session.stats.totalRejected = (session.stats.totalRejected || 0) + 1;
  await session.save();

  // Recalculate remaining queue
  await recalculateQueue(sessionId);

  // Notify rejected user
  const rejectedUserId = getUserIdString(entry.userId);
  if (rejectedUserId) {
    emitUserEvent(rejectedUserId, "participant:rejected", {
      sessionId: String(sessionId),
      reason,
    });
  }

  emitSessionEvent(sessionId, "participant:rejected", {
    sessionId: String(sessionId),
    entryId: String(entry._id),
  });

  return { success: true, entry };
}

/**
 * Pause / Resume Queue
 */
export async function toggleQueuePause(sessionId, hostId, pause = true) {
  const session = await LiveSessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  if (String(session.hostId) !== String(hostId)) {
    throw new Error("Unauthorized");
  }

  session.queuePaused = !!pause;
  await session.save();

  const event = pause ? "session:paused" : "session:resumed";
  emitSessionEvent(sessionId, event, {
    sessionId: String(sessionId),
    queuePaused: session.queuePaused,
  });

  return { success: true, queuePaused: session.queuePaused };
}

/**
 * Handle user socket disconnect with a 30s grace window
 */
export function handleDisconnectGrace(userId) {
  if (!userId) return;

  const timer = setTimeout(async () => {
    disconnectTimers.delete(String(userId));
    try {
      // Find waiting entries and mark expired if still disconnected
      const activeEntries = await QueueEntryModel.find({
        userId,
        status: "WAITING",
      });

      for (const entry of activeEntries) {
        entry.status = "EXPIRED";
        entry.cancellationReason = "Disconnected / Timed out";
        entry.cancellationTime = new Date();
        await entry.save();
        await recalculateQueue(entry.sessionId);
      }
    } catch (err) {
      console.error(`Error handling disconnect expiration for user [${userId}]:`, err);
    }
  }, DISCONNECT_GRACE_PERIOD_MS);

  disconnectTimers.set(String(userId), timer);
}

/**
 * Handle user reconnection (cancel disconnect grace timer)
 */
export function handleReconnect(userId) {
  if (userId && disconnectTimers.has(String(userId))) {
    clearTimeout(disconnectTimers.get(String(userId)));
    disconnectTimers.delete(String(userId));
  }
}

/**
 * Calculate detailed session statistics
 */
export async function getSessionAnalytics(sessionId) {
  const session = await LiveSessionModel.findById(sessionId).populate(
    "hostId",
    "name company_name email account"
  );
  if (!session) throw new Error("Session not found");

  const completedCount = session.stats.totalCompleted || 0;
  const avgWaitTimeMinutes =
    completedCount > 0
      ? Math.round((session.stats.totalWaitTimeSec / completedCount / 60) * 10) / 10
      : 0;

  const avgConsultationMinutes =
    completedCount > 0
      ? Math.round((session.stats.totalConsultationTimeSec / completedCount / 60) * 10) / 10
      : 0;

  const waitingCount = await QueueEntryModel.countDocuments({
    sessionId,
    status: "WAITING",
  });

  const totalInteractions =
    (session.stats.totalCompleted || 0) +
    (session.stats.totalCancelled || 0) +
    (session.stats.totalRejected || 0);

  const abandonmentRate =
    totalInteractions > 0
      ? Math.round(((session.stats.totalCancelled || 0) / totalInteractions) * 100)
      : 0;

  return {
    session,
    analytics: {
      totalJoined: session.stats.totalJoined || 0,
      totalAdmitted: session.stats.totalAdmitted || 0,
      totalCompleted: completedCount,
      totalRejected: session.stats.totalRejected || 0,
      totalCancelled: session.stats.totalCancelled || 0,
      waitingCount,
      avgWaitTimeMinutes,
      avgConsultationMinutes,
      abandonmentRate: `${abandonmentRate}%`,
    },
  };
}
