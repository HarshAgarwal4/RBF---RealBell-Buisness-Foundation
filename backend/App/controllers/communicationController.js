import mongoose from "mongoose";
import NotificationModel from "../models/notification.js";
import MailLogModel from "../models/mailLog.js";
import OrganizationModel from "../models/organization.js";
import TeamModel from "../models/team.js";
import { sendMail } from "../../services/mail.js";
import { logAudit } from "../../services/auditLogger.js";

/* =========================================================================
   HELPER: RESOLVE TARGET RECIPIENTS
   ========================================================================= */
async function resolveTargetRecipients({
  target_type,
  target_team = null,
  selected_user_ids = [],
  organization_types = [],
  custom_emails = [],
}) {
  let userQuery = null;
  let customEmailList = Array.isArray(custom_emails)
    ? custom_emails
        .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    : [];

  switch (target_type) {
    case "all":
    case "all_users":
      userQuery = { accountStatus: { $ne: "disabled" } };
      break;

    case "specific_users":
    case "normal_users_selected":
      if (Array.isArray(selected_user_ids) && selected_user_ids.length > 0) {
        const validIds = selected_user_ids.filter((id) =>
          mongoose.isValidObjectId(id)
        );
        userQuery = { _id: { $in: validIds }, accountStatus: { $ne: "disabled" } };
      }
      break;

    case "team":
      if (target_team && mongoose.isValidObjectId(target_team)) {
        userQuery = { team: target_team, accountStatus: { $ne: "disabled" } };
      }
      break;

    case "team_selected_users":
      if (Array.isArray(selected_user_ids) && selected_user_ids.length > 0) {
        const validIds = selected_user_ids.filter((id) =>
          mongoose.isValidObjectId(id)
        );
        userQuery = { _id: { $in: validIds }, accountStatus: { $ne: "disabled" } };
        if (target_team && mongoose.isValidObjectId(target_team)) {
          userQuery.team = target_team;
        }
      }
      break;

    case "organization_types":
      if (Array.isArray(organization_types) && organization_types.length > 0) {
        userQuery = {
          company_type: { $in: organization_types },
          accountStatus: { $ne: "disabled" },
        };
      }
      break;

    case "super_admins":
      userQuery = { role: "super_admin", accountStatus: { $ne: "disabled" } };
      break;

    case "custom_emails":
      // Pure custom email list
      break;

    default:
      if (Array.isArray(selected_user_ids) && selected_user_ids.length > 0) {
        const validIds = selected_user_ids.filter((id) =>
          mongoose.isValidObjectId(id)
        );
        userQuery = { _id: { $in: validIds } };
      }
      break;
  }

  let matchedUsers = [];
  if (userQuery) {
    matchedUsers = await OrganizationModel.find(userQuery).select(
      "name email role company_name company_type team account.image"
    );
  }

  const userIds = matchedUsers.map((u) => u._id);
  const userEmails = matchedUsers.map((u) => u.email).filter(Boolean);

  // Combine and deduplicate emails
  const allEmails = Array.from(
    new Set([...userEmails, ...customEmailList])
  );

  return {
    users: matchedUsers,
    userIds,
    emails: allEmails,
  };
}

/* =========================================================================
   1. DIRECTORY / RECIPIENTS CATALOG (Helper for Admin UI)
   ========================================================================= */
export async function getRecipientsDirectory(req, res) {
  try {
    const [teams, teamMembers, normalUsers, distinctOrgTypes, superAdmins] =
      await Promise.all([
        TeamModel.find({ status: "active" })
          .select("name slug department status leader")
          .sort({ name: 1 }),

        OrganizationModel.find({
          role: { $in: ["admin", "super_admin"] },
          team: { $ne: null },
          accountStatus: { $ne: "disabled" },
        })
          .select("name email role team account.image")
          .populate("team", "name department")
          .sort({ name: 1 }),

        OrganizationModel.find({
          role: "normal",
          accountStatus: { $ne: "disabled" },
        })
          .select("name email company_name company_type role account.image")
          .sort({ name: 1 })
          .limit(2000),

        OrganizationModel.distinct("company_type", {
          company_type: { $ne: null, $nin: ["", "admin", "super_admin"] },
        }),

        OrganizationModel.find({
          role: "super_admin",
          accountStatus: { $ne: "disabled" },
        })
          .select("name email role account.image")
          .sort({ name: 1 }),
      ]);

    // Count users per organization type
    const orgTypeCounts = await OrganizationModel.aggregate([
      {
        $match: {
          company_type: { $in: distinctOrgTypes },
          accountStatus: { $ne: "disabled" },
        },
      },
      {
        $group: {
          _id: "$company_type",
          count: { $sum: 1 },
        },
      },
    ]);

    const orgTypesWithCounts = distinctOrgTypes.map((type) => {
      const found = orgTypeCounts.find((c) => c._id === type);
      return {
        type,
        count: found ? found.count : 0,
      };
    });

    return res.json({
      status: 1,
      teams,
      teamMembers,
      normalUsers,
      organizationTypes: orgTypesWithCounts,
      superAdmins,
      summary: {
        totalTeams: teams.length,
        totalTeamMembers: teamMembers.length,
        totalNormalUsers: normalUsers.length,
        totalSuperAdmins: superAdmins.length,
      },
    });
  } catch (err) {
    console.error("getRecipientsDirectory error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* =========================================================================
   2. NOTIFICATION MANAGEMENT (Super Admin)
   ========================================================================= */

// Dispatch Notification
export async function sendAdminNotification(req, res) {
  try {
    const {
      title,
      message,
      type = "info",
      priority = "normal",
      action_url = null,
      target_type = "specific_users",
      target_team = null,
      selected_user_ids = [],
      organization_types = [],
      sent_as_email = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 0, msg: "Notification title is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ status: 0, msg: "Notification message is required" });
    }

    const { users, userIds, emails } = await resolveTargetRecipients({
      target_type,
      target_team,
      selected_user_ids,
      organization_types,
    });

    if (userIds.length === 0) {
      return res.status(400).json({
        status: 0,
        msg: "No valid recipients found matching your target selection",
      });
    }

    let emailSentCount = 0;
    let emailFailedCount = 0;

    // Send emails if requested
    if (sent_as_email && emails.length > 0) {
      const emailSubject = `[RealBell] ${title.trim()}`;
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px 30px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">RealBell Business Foundation</h2>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.85;">Official Platform Notification</p>
          </div>
          <div style="padding: 28px 30px; color: #1e293b; line-height: 1.6;">
            <h3 style="margin: 0 0 14px; font-size: 17px; color: #0f172a; font-weight: 600;">${title.trim()}</h3>
            <div style="font-size: 14px; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">${message.trim()}</div>
            ${
              action_url
                ? `<div style="margin-top: 20px;"><a href="${action_url}" style="background: #4f46e5; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; display: inline-block;">View Details</a></div>`
                : ""
            }
          </div>
          <div style="background: #f8fafc; padding: 16px 30px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
            This is an automated notification from RealBell Business Foundation.
          </div>
        </div>
      `;

      // Dispatch emails in parallel batches
      const batchSize = 10;
      for (let i = 0; i < emails.length; i += batchSize) {
        const chunk = emails.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (email) => {
            try {
              const success = await sendMail(email, emailSubject, emailHtml);
              if (success) emailSentCount++;
              else emailFailedCount++;
            } catch {
              emailFailedCount++;
            }
          })
        );
      }
    }

    const newNotification = await NotificationModel.create({
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      action_url: action_url ? action_url.trim() : null,
      target_type,
      target_team: target_team || null,
      target_organization_types: organization_types || [],
      recipients: userIds,
      read_by: [],
      sent_by: req.user._id,
      sent_as_email: Boolean(sent_as_email),
      email_delivery_status: {
        sent: emailSentCount,
        failed: emailFailedCount,
      },
    });

    await logAudit({
      action: "NOTIFICATION_DISPATCHED",
      performedBy: req.user,
      targetType: "Notification",
      targetId: newNotification._id,
      details: {
        title: newNotification.title,
        target_type: newNotification.target_type,
        recipient_count: userIds.length,
        sent_as_email: newNotification.sent_as_email,
        email_sent: emailSentCount,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    const populatedNotification = await NotificationModel.findById(
      newNotification._id
    )
      .populate("sent_by", "name email role account.image")
      .populate("target_team", "name department");

    return res.status(201).json({
      status: 1,
      msg: `Notification dispatched successfully to ${userIds.length} recipient(s)${
        sent_as_email ? ` (${emailSentCount} email(s) delivered)` : ""
      }`,
      notification: populatedNotification,
    });
  } catch (err) {
    console.error("sendAdminNotification error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Get Admin Notifications List
export async function getAdminNotifications(req, res) {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      type = "",
      target_type = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.type = type;
    if (target_type) query.target_type = target_type;

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, stats] = await Promise.all([
      NotificationModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sent_by", "name email role account.image")
        .populate("target_team", "name department")
        .populate("recipients", "name email company_name role account.image"),
      NotificationModel.countDocuments(query),
      NotificationModel.aggregate([
        {
          $facet: {
            all: [{ $count: "count" }],
            info: [{ $match: { type: "info" } }, { $count: "count" }],
            announcement: [
              { $match: { type: "announcement" } },
              { $count: "count" },
            ],
            warning: [{ $match: { type: "warning" } }, { $count: "count" }],
            success: [{ $match: { type: "success" } }, { $count: "count" }],
            withEmail: [
              { $match: { sent_as_email: true } },
              { $count: "count" },
            ],
          },
        },
      ]),
    ]);

    const facet = stats?.[0] || {};

    return res.json({
      status: 1,
      notifications,
      stats: {
        total: facet.all?.[0]?.count || 0,
        info: facet.info?.[0]?.count || 0,
        announcement: facet.announcement?.[0]?.count || 0,
        warning: facet.warning?.[0]?.count || 0,
        success: facet.success?.[0]?.count || 0,
        withEmail: facet.withEmail?.[0]?.count || 0,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (err) {
    console.error("getAdminNotifications error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Delete Notification (Super Admin Only)
export async function deleteAdminNotification(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        status: 0,
        msg: "Access denied. Only Super Admin has permission to delete notification dispatch logs.",
      });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid notification ID" });
    }

    const notification = await NotificationModel.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ status: 0, msg: "Notification not found" });
    }

    await logAudit({
      action: "NOTIFICATION_DELETED",
      performedBy: req.user,
      targetType: "Notification",
      targetId: id,
      details: { title: notification.title },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({ status: 1, msg: "Notification deleted successfully" });
  } catch (err) {
    console.error("deleteAdminNotification error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* =========================================================================
   3. MAIL DISPATCHER MANAGEMENT (Super Admin)
   ========================================================================= */

// Dispatch Custom or Bulk Email
export async function sendAdminMail(req, res) {
  try {
    const {
      subject,
      body,
      target_type = "custom_emails",
      target_team = null,
      selected_user_ids = [],
      organization_types = [],
      custom_emails = [],
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ status: 0, msg: "Email subject is required" });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ status: 0, msg: "Email message body is required" });
    }

    const { users, userIds, emails } = await resolveTargetRecipients({
      target_type,
      target_team,
      selected_user_ids,
      organization_types,
      custom_emails,
    });

    if (emails.length === 0) {
      return res.status(400).json({
        status: 0,
        msg: "No recipient email addresses provided or resolved",
      });
    }

    const emailSubject = subject.trim();
    const formattedHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px 30px; color: #ffffff; border-bottom: 3px solid #6366f1;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">RealBell Business Foundation</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Official Communication</p>
        </div>
        <div style="padding: 30px; color: #1e293b; line-height: 1.65;">
          <h3 style="margin: 0 0 16px; font-size: 18px; color: #0f172a; font-weight: 700;">${emailSubject}</h3>
          <div style="font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap;">${body.trim()}</div>
        </div>
        <div style="background: #f8fafc; padding: 18px 30px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          Sent by RealBell Business Foundation Administration • © ${new Date().getFullYear()} RealBell
        </div>
      </div>
    `;

    let successCount = 0;
    let failCount = 0;
    const errorDetails = [];

    // Dispatch emails concurrently in chunks
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const chunk = emails.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (email) => {
          try {
            const success = await sendMail(email, emailSubject, formattedHtml);
            if (success) {
              successCount++;
            } else {
              failCount++;
              errorDetails.push(`Failed sending to ${email}`);
            }
          } catch (e) {
            failCount++;
            errorDetails.push(`Error for ${email}: ${e.message}`);
          }
        })
      );
    }

    const deliveryStatus =
      failCount === 0 ? "sent" : successCount === 0 ? "failed" : "partially_failed";

    const newMailLog = await MailLogModel.create({
      subject: emailSubject,
      body: body.trim(),
      target_type,
      target_team: target_team || null,
      target_organization_types: organization_types || [],
      recipient_emails: emails,
      recipients: userIds,
      sent_by: req.user._id,
      status: deliveryStatus,
      success_count: successCount,
      fail_count: failCount,
      error_details: errorDetails.slice(0, 50),
    });

    await logAudit({
      action: "EMAIL_DISPATCHED",
      performedBy: req.user,
      targetType: "MailLog",
      targetId: newMailLog._id,
      details: {
        subject: newMailLog.subject,
        target_type: newMailLog.target_type,
        total_recipients: emails.length,
        success_count: successCount,
        fail_count: failCount,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    const populatedMail = await MailLogModel.findById(newMailLog._id)
      .populate("sent_by", "name email role account.image")
      .populate("target_team", "name department");

    return res.status(201).json({
      status: 1,
      msg: `Emails dispatched: ${successCount} sent successfully${
        failCount > 0 ? `, ${failCount} failed` : ""
      }`,
      mailLog: populatedMail,
    });
  } catch (err) {
    console.error("sendAdminMail error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Get Admin Mail Outbox List
export async function getAdminMailLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      status = "",
      target_type = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
        { recipient_emails: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (status) query.status = status;
    if (target_type) query.target_type = target_type;

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [mailLogs, total, stats] = await Promise.all([
      MailLogModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sent_by", "name email role account.image")
        .populate("target_team", "name department")
        .populate("recipients", "name email company_name role account.image"),
      MailLogModel.countDocuments(query),
      MailLogModel.aggregate([
        {
          $facet: {
            all: [{ $count: "count" }],
            sent: [{ $match: { status: "sent" } }, { $count: "count" }],
            partially_failed: [
              { $match: { status: "partially_failed" } },
              { $count: "count" },
            ],
            failed: [{ $match: { status: "failed" } }, { $count: "count" }],
            totalEmailsSent: [
              { $group: { _id: null, total: { $sum: "$success_count" } } },
            ],
          },
        },
      ]),
    ]);

    const facet = stats?.[0] || {};

    return res.json({
      status: 1,
      mailLogs,
      stats: {
        total: facet.all?.[0]?.count || 0,
        sent: facet.sent?.[0]?.count || 0,
        partiallyFailed: facet.partially_failed?.[0]?.count || 0,
        failed: facet.failed?.[0]?.count || 0,
        totalDeliveredEmails: facet.totalEmailsSent?.[0]?.total || 0,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (err) {
    console.error("getAdminMailLogs error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Delete Mail Log (Super Admin Only)
export async function deleteAdminMailLog(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        status: 0,
        msg: "Access denied. Only Super Admin has permission to delete mail dispatch logs.",
      });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid mail log ID" });
    }

    const mailLog = await MailLogModel.findByIdAndDelete(id);
    if (!mailLog) {
      return res.status(404).json({ status: 0, msg: "Mail log not found" });
    }

    await logAudit({
      action: "MAIL_LOG_DELETED",
      performedBy: req.user,
      targetType: "MailLog",
      targetId: id,
      details: { subject: mailLog.subject },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({ status: 1, msg: "Mail log deleted successfully" });
  } catch (err) {
    console.error("deleteAdminMailLog error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* =========================================================================
   4. USER-FACING IN-APP NOTIFICATIONS
   ========================================================================= */

// Get current user's notifications
export async function getMyNotifications(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ status: 0, msg: "Authentication required" });
    }

    const { page = 1, limit = 20, unreadOnly = "false" } = req.query;
    const userId = req.user._id;

    const query = {
      recipients: userId,
    };

    if (unreadOnly === "true") {
      query.read_by = { $ne: userId };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sent_by", "name account.image"),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({
        recipients: userId,
        read_by: { $ne: userId },
      }),
    ]);

    const formatted = notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      action_url: n.action_url,
      isRead: n.read_by.some((id) => String(id) === String(userId)),
      createdAt: n.createdAt,
      sent_by: n.sent_by,
    }));

    return res.json({
      status: 1,
      notifications: formatted,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Mark single notification as read
export async function markNotificationRead(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ status: 0, msg: "Authentication required" });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ status: 0, msg: "Invalid notification ID" });
    }

    await NotificationModel.updateOne(
      { _id: id, recipients: req.user._id },
      { $addToSet: { read_by: req.user._id } }
    );

    return res.json({ status: 1, msg: "Notification marked as read" });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

// Mark all user notifications as read
export async function markAllNotificationsRead(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ status: 0, msg: "Authentication required" });
    }

    await NotificationModel.updateMany(
      { recipients: req.user._id, read_by: { $ne: req.user._id } },
      { $addToSet: { read_by: req.user._id } }
    );

    return res.json({ status: 1, msg: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}
