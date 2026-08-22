import TicketModel from "../models/ticket.js";
import { uploadFileToCloud, deleteImageByUrl } from "../../services/upload.js";

const memoryTickets = [];

const isMongooseConnected = () => TicketModel.db && TicketModel.db.readyState === 1;

const collectUploadedFiles = (req) => {
  const files = [];

  if (Array.isArray(req.files) && req.files.length > 0) {
    files.push(...req.files);
  }

  if (req.file) {
    files.push(req.file);
  }

  return files;
};

const uploadTicketFiles = async (files) => {
  const attachments = [];

  for (const file of files) {
    try {
      const uploaded = await uploadFileToCloud(file.buffer, file.originalname, {
        folder: "RBF/tickets",
        allowedFormats: [],
      });

      attachments.push({
        url: uploaded.secure_url || uploaded.url,
        public_id: uploaded.public_id || "",
        original_name: file.originalname,
        mime_type: file.mimetype || "",
        size_in_bytes: file.size || 0,
      });
    } catch (error) {
      console.error("Failed to upload ticket attachment:", error);
    }
  }

  return attachments;
};

const normalizeTicket = (ticket) => {
  if (!ticket) return ticket;

  if (typeof ticket.toObject === "function") {
    return ticket.toObject();
  }

  return ticket;
};

export const createTicket = async (req, res) => {
  try {
    const { issue_type, title, description, source, priority } = req.body;

    if (!issue_type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Issue type, title, and description are required",
      });
    }

    const attachments = await uploadTicketFiles(collectUploadedFiles(req));

    const ticketData = {
      organization: req.user?._id || null,
      issue_type,
      title,
      description,
      priority: priority && ["Low", "Medium", "High", "Urgent"].includes(priority) ? priority : "Medium",
      status: "Open",
      attachments,
      source: source || "web",
      meta: {
        created_by: req.user?._id || null,
      },
    };

    let ticket;
    if (isMongooseConnected()) {
      ticket = await TicketModel.create(ticketData);
    } else {
      ticket = {
        _id: `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...ticketData,
      };
      memoryTickets.unshift(ticket);
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: normalizeTicket(ticket),
    });
  } catch (error) {
    console.error("Error in createTicket:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create ticket",
    });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, issue_type } = req.query;
    const organizationId = req.user?._id;

    if (isMongooseConnected()) {
      const query = { organization: organizationId };
      if (status) query.status = status;
      if (issue_type) query.issue_type = issue_type;

      const tickets = await TicketModel.find(query)
        .sort({ createdAt: -1 })
        .populate("organization", "name company_name email");

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    }

    let filtered = memoryTickets.filter((ticket) => String(ticket.organization) === String(organizationId));
    if (status) filtered = filtered.filter((ticket) => ticket.status === status);
    if (issue_type) filtered = filtered.filter((ticket) => ticket.issue_type === issue_type);

    return res.status(200).json({
      success: true,
      count: filtered.length,
      tickets: filtered,
    });
  } catch (error) {
    console.error("Error in getTickets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?._id;

    if (isMongooseConnected()) {
      const ticket = await TicketModel.findOne({
        _id: id,
        organization: organizationId,
      }).populate("organization", "name company_name email");

      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    const ticket = memoryTickets.find(
      (item) => String(item._id) === String(id) && String(item.organization) === String(organizationId)
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Error in getTicketById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?._id;
    const uploadedFiles = collectUploadedFiles(req);
    const newAttachments = await uploadTicketFiles(uploadedFiles);
    let currentAttachments = [];

    const updateData = {
      ...(req.body || {}),
      updatedAt: new Date(),
    };

    if (isMongooseConnected()) {
      const ticket = await TicketModel.findOne({ _id: id, organization: organizationId });
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      currentAttachments = ticket.attachments || [];

      if (newAttachments.length > 0) {
        updateData.attachments = [...currentAttachments, ...newAttachments];
      }

      Object.assign(ticket, updateData);
      await ticket.save();

      return res.status(200).json({
        success: true,
        message: "Ticket updated successfully",
        ticket,
      });
    }

    const index = memoryTickets.findIndex(
      (item) => String(item._id) === String(id) && String(item.organization) === String(organizationId)
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    currentAttachments = memoryTickets[index].attachments || [];
    if (newAttachments.length > 0) {
      updateData.attachments = [...currentAttachments, ...newAttachments];
    }

    memoryTickets[index] = {
      ...memoryTickets[index],
      ...updateData,
    };

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket: memoryTickets[index],
    });
  } catch (error) {
    console.error("Error in updateTicket:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?._id;

    if (isMongooseConnected()) {
      const ticket = await TicketModel.findOne({ _id: id, organization: organizationId });
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      for (const attachment of ticket.attachments || []) {
        if (attachment?.url) {
          try {
            await deleteImageByUrl(attachment.url);
          } catch (error) {
            console.warn("Could not delete ticket attachment:", error.message);
          }
        }
      }

      await TicketModel.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Ticket deleted successfully",
      });
    }

    const index = memoryTickets.findIndex(
      (item) => String(item._id) === String(id) && String(item.organization) === String(organizationId)
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    memoryTickets.splice(index, 1);
    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTicket:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};
