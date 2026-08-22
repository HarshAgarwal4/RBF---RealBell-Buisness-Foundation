import AuditLogModel from "../models/auditLog.js";

/**
 * Get paginated administrative audit logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 25, action = "", targetType = "", search = "" } = req.query;

    const query = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { targetType: { $regex: search, $options: "i" } },
        { targetId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("performedBy", "name email account.image role customRole"),
      AuditLogModel.countDocuments(query),
    ]);

    return res.json({
      status: 1,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch audit logs" });
  }
}
