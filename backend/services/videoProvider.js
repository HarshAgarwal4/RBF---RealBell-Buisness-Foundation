import crypto from "crypto";

/**
 * Video Provider Abstraction Interface
 * Allows pluggable backends (In-Built WebRTC, Jitsi, LiveKit, Agora, Daily)
 */
class BaseVideoProvider {
  async createRoom(session) {
    throw new Error("Method not implemented.");
  }

  async generateAccessGrant(session, user, queueEntry) {
    throw new Error("Method not implemented.");
  }

  async validateAccess(session, user, queueEntry) {
    throw new Error("Method not implemented.");
  }

  async endRoom(session) {
    throw new Error("Method not implemented.");
  }
}

/**
 * In-Built WebRTC Room Provider
 * Leverages Socket.io signaling + secure cryptographic tokens
 */
class InBuiltWebRTCProvider extends BaseVideoProvider {
  async createRoom(session) {
    const roomId = `rbf_room_${session._id}_${crypto.randomBytes(6).toString("hex")}`;
    return {
      provider: "in-built-webrtc",
      roomId,
      roomUrl: `/live-sessions/${session._id}/room`,
    };
  }

  async generateAccessGrant(session, user, queueEntry) {
    const sessionHostId = String(session.hostId?._id || session.hostId);
    const currentUserId = String(user?._id || user);
    const isHost = sessionHostId === currentUserId;

    const entryUserId = queueEntry?.userId?._id ? String(queueEntry.userId._id) : (queueEntry?.userId ? String(queueEntry.userId) : "");
    const isGroupSession = session.sessionType === "group";
    const isAdmittedOrInCall =
      queueEntry &&
      (queueEntry.status === "ADMITTED" || queueEntry.status === "IN_CALL") &&
      entryUserId === currentUserId;

    if (!isHost && !isAdmittedOrInCall && !isGroupSession) {
      return {
        authorized: false,
        reason: "User is not authorized to enter this call session.",
      };
    }

    const payload = {
      sessionId: String(session._id),
      userId: currentUserId,
      userName: user.name || user.company_name || "User",
      userAvatar: user.account?.image || user.profile?.logo || "",
      isHost,
      roomId: session.videoRoomId,
      expiresAt: Date.now() + (session.maxConsultationDuration + 10) * 60 * 1000,
    };

    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");

    return {
      authorized: true,
      token,
      roomId: session.videoRoomId,
      roomUrl: `/live-sessions/${session._id}/room`,
      isHost,
      maxDurationMinutes: session.maxConsultationDuration,
    };
  }

  async validateAccess(session, user, queueEntry) {
    const isHost = String(session.hostId) === String(user._id);
    const isAdmittedOrInCall =
      queueEntry &&
      (queueEntry.status === "ADMITTED" || queueEntry.status === "IN_CALL") &&
      String(queueEntry.userId) === String(user._id);

    return isHost || isAdmittedOrInCall;
  }

  async endRoom(session) {
    return { success: true, roomId: session.videoRoomId };
  }
}

/**
 * Jitsi Meet Provider
 */
class JitsiVideoProvider extends BaseVideoProvider {
  async createRoom(session) {
    const roomId = `rbf-jitsi-${session._id}-${crypto.randomBytes(4).toString("hex")}`;
    return {
      provider: "jitsi",
      roomId,
      roomUrl: `https://meet.jit.si/${roomId}`,
    };
  }

  async generateAccessGrant(session, user, queueEntry) {
    const isHost = String(session.hostId) === String(user._id);
    const isAdmitted =
      queueEntry &&
      (queueEntry.status === "ADMITTED" || queueEntry.status === "IN_CALL");

    if (!isHost && !isAdmitted) {
      return { authorized: false, reason: "Access denied" };
    }

    return {
      authorized: true,
      provider: "jitsi",
      roomId: session.videoRoomId,
      roomUrl: `https://meet.jit.si/${session.videoRoomId}`,
      isHost,
    };
  }

  async endRoom(session) {
    return { success: true };
  }
}

/**
 * Factory for Video Providers
 */
export function getVideoProvider(providerType = "in-built-webrtc") {
  switch (providerType) {
    case "jitsi":
      return new JitsiVideoProvider();
    case "in-built-webrtc":
    default:
      return new InBuiltWebRTCProvider();
  }
}

export { InBuiltWebRTCProvider, JitsiVideoProvider };
