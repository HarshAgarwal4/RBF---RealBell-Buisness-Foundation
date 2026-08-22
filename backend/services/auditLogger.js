import AuditLogModel from "../App/models/auditLog.js";

/**
 * Record an administrative audit log entry
 */
export async function logAudit({
  action,
  performedBy,
  targetType = "",
  targetId = "",
  details = {},
  ipAddress = "",
}) {
  try {
    await AuditLogModel.create({
      action,
      performedBy: performedBy?._id || performedBy || null,
      targetType,
      targetId: String(targetId || ""),
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("Audit log recording error:", err.message);
  }
}
