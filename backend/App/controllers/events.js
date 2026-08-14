import mongoose from "mongoose";
import EventModel from "../models/event.js";
import EventRegistrationModel from "../models/eventRegistration.js";
import { uploadFileToCloud } from "../../services/upload.js";
import fetch from "node-fetch";

/* ── Helper: upload banner + logo from req.files ── */
async function uploadEventImages(files = {}) {
  const results = {};
  const IMG_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

  if (files.banner_image?.[0]) {
    const f = files.banner_image[0];
    const r = await uploadFileToCloud(f.buffer, f.originalname, {
      folder: "RBF/events/banners",
      resourceType: "image",
      allowedFormats: IMG_FORMATS,
    });
    results.banner_image = r.secure_url || r.url;
  }

  if (files.logo?.[0]) {
    const f = files.logo[0];
    const r = await uploadFileToCloud(f.buffer, f.originalname, {
      folder: "RBF/events/logos",
      resourceType: "image",
      allowedFormats: IMG_FORMATS,
    });
    results.logo = r.secure_url || r.url;
  }

  return results;
}

/* ══════════════════════════════════════════════════
   PUBLIC — User-facing routes
══════════════════════════════════════════════════ */

/** GET /events/public — list published events */
async function getAllEventsPublic(req, res) {
  try {
    const { search = "", tag = "", month = "", year = "" } = req.query;
    const query = { status: "published" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }
    if (tag) query.tags = tag;

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      query.event_date = { $gte: start, $lte: end };
    }

    const events = await EventModel.find(query)
      .sort({ event_date: 1 })
      .populate("created_by", "name company_name account")
      .select("-custom_form_fields -ai_raw_input -rich_blocks -ai_content");

    return res.json({ status: 1, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /events/public/:id — get a single published event */
async function getEventByIdPublic(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const event = await EventModel.findOne({ _id: id, status: "published" })
      .populate("created_by", "name company_name account");

    if (!event)
      return res.status(404).json({ status: 9, msg: "Event not found" });

    // Check if current user already registered
    const existing = await EventRegistrationModel.findOne({
      event: id,
      user: req.user._id,
    });

    return res.json({ status: 1, event, myRegistration: existing || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /events/register/:id — register / buy ticket for event */
async function registerForEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const event = await EventModel.findOne({ _id: id, status: "published" });
    if (!event)
      return res.status(404).json({ status: 9, msg: "Event not found" });

    // Deadline check
    if (event.registration_deadline && new Date() > event.registration_deadline)
      return res.status(400).json({ status: 7, msg: "Registration deadline has passed" });

    // Capacity check
    if (event.total_tickets > 0 && event.tickets_sold >= event.total_tickets)
      return res.status(400).json({ status: 7, msg: "Event is fully booked / Sold Out" });

    // Duplicate check
    const existing = await EventRegistrationModel.findOne({
      event: id,
      user: req.user._id,
    });
    if (existing)
      return res.status(400).json({ status: 7, msg: "You have already registered for this event" });

    const { registration_type = "free", custom_responses = [] } = req.body;

    // Validate required custom fields
    for (const field of event.custom_form_fields) {
      if (field.required) {
        const resp = custom_responses.find((r) => r.field_id === field.id);
        if (!resp || resp.value === "" || resp.value === null || resp.value === undefined) {
          return res.status(400).json({
            status: 7,
            msg: `Field "${field.label}" is required`,
          });
        }
      }
    }

    let amount_paid = 0;
    let tokens_used = 0;

    if (event.event_type === "paid") {
      if (registration_type === "paid_ticket") {
        amount_paid = event.price || 0;
      } else if (registration_type === "paid_token") {
        tokens_used = event.token_price || 0;
      } else {
        return res.status(400).json({ status: 7, msg: "Please select a valid payment method (Ticket or Token)" });
      }
    }

    const registration = await EventRegistrationModel.create({
      event: id,
      user: req.user._id,
      registration_type: event.event_type === "free" ? "free" : registration_type,
      amount_paid,
      tokens_used,
      custom_responses,
      status: "registered",
    });

    // Increment tickets_sold count
    await EventModel.findByIdAndUpdate(id, { $inc: { tickets_sold: 1 } });

    return res.json({
      status: 1,
      msg: "Event registration successful!",
      registration,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /events/my-registrations — current user's event registrations */
async function getMyEventRegistrations(req, res) {
  try {
    const registrations = await EventRegistrationModel.find({
      user: req.user._id,
    })
      .populate("event")
      .sort({ createdAt: -1 });

    return res.json({ status: 1, registrations });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ══════════════════════════════════════════════════
   ADMIN — Management routes (Admin & Super Admin)
══════════════════════════════════════════════════ */

/** GET /events/admin — list all events (any status) */
async function getAllEventsAdmin(req, res) {
  try {
    const { status = "", search = "" } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { short_description: { $regex: search, $options: "i" } },
      ];
    }

    const events = await EventModel.find(query)
      .sort({ event_date: -1 })
      .populate("created_by", "name company_name account");

    return res.json({ status: 1, events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /events/admin/:id — get single event details */
async function getEventByIdAdmin(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const event = await EventModel.findById(id).populate(
      "created_by",
      "name company_name"
    );
    if (!event)
      return res.status(404).json({ status: 9, msg: "Event not found" });

    const registrationCount = await EventRegistrationModel.countDocuments({ event: id });

    return res.json({ status: 1, event, registrationCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /events/admin — create a new event */
async function createEvent(req, res) {
  try {
    const body = req.body;
    const parse = (key) => {
      try {
        return typeof body[key] === "string" ? JSON.parse(body[key]) : body[key];
      } catch {
        return body[key];
      }
    };

    const {
      title,
      short_description,
      status,
      event_type,
      price,
      token_price,
      total_tickets,
      event_date,
      event_end_date,
      location_type,
      venue,
      registration_deadline,
      content_type,
      ai_raw_input,
      ai_content,
    } = body;

    const payment_options = parse("payment_options") || ["ticket"];
    const rich_blocks = parse("rich_blocks") || [];
    const custom_form_fields = parse("custom_form_fields") || [];
    const tags = parse("tags") || [];
    const external_links = parse("external_links") || [];

    if (!title) return res.status(400).json({ status: 7, msg: "Title is required" });
    if (!event_date) return res.status(400).json({ status: 7, msg: "Event start date is required" });

    const images = await uploadEventImages(req.files || {});

    const event = await EventModel.create({
      title,
      short_description,
      banner_image: images.banner_image || "",
      logo: images.logo || "",
      created_by: req.user._id,
      status: status || "draft",
      event_type: event_type || "free",
      payment_options,
      price: price ? Number(price) : 0,
      token_price: token_price ? Number(token_price) : 0,
      total_tickets: total_tickets ? Number(total_tickets) : 0,
      event_date,
      event_end_date: event_end_date || null,
      location_type: location_type || "online",
      venue: venue || "",
      registration_deadline: registration_deadline || null,
      content_type: content_type || "rich_editor",
      ai_raw_input,
      ai_content,
      rich_blocks,
      custom_form_fields,
      tags,
      external_links,
    });

    return res.json({ status: 1, msg: "Event created successfully", event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** PUT /events/admin/:id — update an event */
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const body = req.body;
    const parse = (key) => {
      try {
        return typeof body[key] === "string" ? JSON.parse(body[key]) : body[key];
      } catch {
        return body[key];
      }
    };

    const allowed = [
      "title",
      "short_description",
      "status",
      "event_type",
      "price",
      "token_price",
      "total_tickets",
      "event_date",
      "event_end_date",
      "location_type",
      "venue",
      "registration_deadline",
      "content_type",
      "ai_raw_input",
      "ai_content",
    ];

    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.payment_options !== undefined) updates.payment_options = parse("payment_options");
    if (body.rich_blocks !== undefined) updates.rich_blocks = parse("rich_blocks");
    if (body.custom_form_fields !== undefined) updates.custom_form_fields = parse("custom_form_fields");
    if (body.tags !== undefined) updates.tags = parse("tags");
    if (body.external_links !== undefined) updates.external_links = parse("external_links");

    const images = await uploadEventImages(req.files || {});
    if (images.banner_image) updates.banner_image = images.banner_image;
    if (images.logo) updates.logo = images.logo;

    const event = await EventModel.findByIdAndUpdate(id, updates, { new: true });
    if (!event) return res.status(404).json({ status: 9, msg: "Event not found" });

    return res.json({ status: 1, msg: "Event updated successfully", event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** DELETE /events/admin/:id — delete an event */
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const event = await EventModel.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ status: 9, msg: "Event not found" });

    // Delete all registrations for this event
    await EventRegistrationModel.deleteMany({ event: id });

    return res.json({ status: 1, msg: "Event deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** POST /events/admin/ai-generate — generate formatted markdown using AI */
async function generateEventAIContent(req, res) {
  try {
    const { raw_text } = req.body;
    if (!raw_text || raw_text.trim().length < 10)
      return res.status(400).json({ status: 7, msg: "Please provide more text to format" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are an expert event content formatter. Your job is to take raw event descriptions and transform them into engaging, structured markdown. Use clear headings (##, ###), bullet points, key takeaways, agendas, and bold text. Make it exciting, professional, and easy to read. Only return the formatted markdown, nothing else.",
          },
          {
            role: "user",
            content: `Please format this event description into beautiful markdown:\n\n${raw_text}`,
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return res.status(500).json({ status: 0, msg: "AI generation failed" });
    }

    const data = await response.json();
    const formatted = data.choices?.[0]?.message?.content || "";

    return res.json({ status: 1, formatted_content: formatted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/** GET /events/admin/:id/attendees — list attendees for an event */
async function getEventAttendees(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ status: 7, msg: "Invalid event id" });

    const attendees = await EventRegistrationModel.find({ event: id })
      .populate(
        "user",
        "name company_name email phone company_type profile account"
      )
      .sort({ createdAt: -1 });

    return res.json({ status: 1, attendees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

export {
  getAllEventsPublic,
  getEventByIdPublic,
  registerForEvent,
  getMyEventRegistrations,
  getAllEventsAdmin,
  getEventByIdAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  generateEventAIContent,
  getEventAttendees,
};
