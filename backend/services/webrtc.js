import {
  setInRedis,
  getFromRedis,
  deleteFromRedis,
} from "./Redis.js";

const CALL_TTL = 300; // 5 mins ringing TTL
const ACTIVE_CALL_TTL = 7200; // 2 hours active call TTL

export async function createCallSession({
  callId,
  callerId,
  callerName,
  callerAvatar = "",
  receiverId,
  callType = "video",
}) {
  const session = {
    callId,
    callerId: String(callerId),
    callerName: callerName || "Unknown Caller",
    callerAvatar: callerAvatar || "",
    receiverId: String(receiverId),
    callType,
    status: "ringing",
    createdAt: new Date().toISOString(),
  };

  await setInRedis(`webrtc:call:${callId}`, JSON.stringify(session), CALL_TTL);
  await setInRedis(`webrtc:user_call:${callerId}`, callId, CALL_TTL);
  await setInRedis(`webrtc:user_call:${receiverId}`, callId, CALL_TTL);

  return session;
}

export async function getCallSession(callId) {
  if (!callId) return null;
  const raw = await getFromRedis(`webrtc:call:${callId}`);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error(`Error parsing call session [${callId}]:`, err);
    return null;
  }
}

export async function getUserActiveCall(userId) {
  if (!userId) return null;
  const callId = await getFromRedis(`webrtc:user_call:${userId}`);
  if (!callId) return null;

  const session = await getCallSession(callId);
  return session;
}

export async function updateCallStatus(callId, status) {
  const session = await getCallSession(callId);
  if (!session) return null;

  session.status = status;
  session.updatedAt = new Date().toISOString();

  await setInRedis(
    `webrtc:call:${callId}`,
    JSON.stringify(session),
    ACTIVE_CALL_TTL
  );
  await setInRedis(
    `webrtc:user_call:${session.callerId}`,
    callId,
    ACTIVE_CALL_TTL
  );
  await setInRedis(
    `webrtc:user_call:${session.receiverId}`,
    callId,
    ACTIVE_CALL_TTL
  );

  return session;
}

export async function clearCallSession(callId) {
  if (!callId) return;
  const session = await getCallSession(callId);

  if (session) {
    await deleteFromRedis(`webrtc:user_call:${session.callerId}`);
    await deleteFromRedis(`webrtc:user_call:${session.receiverId}`);
  }

  await deleteFromRedis(`webrtc:call:${callId}`);
}

export async function clearUserCall(userId) {
  if (!userId) return;
  const callId = await getFromRedis(`webrtc:user_call:${userId}`);
  if (callId) {
    await clearCallSession(callId);
  }
}
