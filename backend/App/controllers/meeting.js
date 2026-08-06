import Meeting from "../models/meeting.js";
import Organization from "../models/organization.js";

/**
 * GET /api/meetings/connections
 * Returns only the accepted connections of the logged-in org,
 * so the frontend dropdown can only show people the user is connected with.
 */
export const getSchedulableConnections = async (req, res) => {
  try {
    const org = await Organization.findById(req.user._id).populate(
      "connections.with",
      "name company_name email"
    );

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const connections = org.connections
      .filter((c) => c.status === "accepted")
      .map((c) => c.with);

    res.status(200).json({ connections });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch connections", error: error.message });
  }
};

/**
 * POST /api/meetings
 * Create a new meeting. Attendee must be an accepted connection.
 */
export const createMeeting = async (req, res) => {
  try {
    const { attendee, title, agenda, duration, date, startTime, mode, meetingTool, meetingUrl } =
      req.body;

    if (!attendee || !title || !agenda || !duration || !date || !startTime || !mode) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const org = await Organization.findById(req.user._id);

    const isConnected = org.connections.some(
      (c) => c.with.toString() === attendee && c.status === "accepted"
    );

    if (!isConnected) {
      return res
        .status(403)
        .json({ message: "You can only schedule meetings with your connections." });
    }

    const meeting = await Meeting.create({
      organizer: req.user._id,
      attendee,
      title,
      agenda,
      duration,
      date,
      startTime,
      mode,
      meetingTool: meetingTool || "In-built",
      meetingUrl: meetingUrl || "",
    });

    res.status(201).json({ message: "Meeting scheduled successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: "Failed to schedule meeting", error: error.message });
  }
};

/**
 * GET /api/meetings
 * All meetings where the logged-in org is either organizer or attendee.
 */
export const getMyMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ organizer: req.user._id }, { attendee: req.user._id }],
    })
      .populate("organizer", "name company_name")
      .populate("attendee", "name company_name")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch meetings", error: error.message });
  }
};

/**
 * GET /api/meetings/requests
 * Pending meeting requests received by the logged-in org.
 */
export const getMeetingRequests = async (req, res) => {
  try {
    const requests = await Meeting.find({
      attendee: req.user._id,
      status: "pending",
    })
      .populate("organizer", "name company_name")
      .sort({ date: 1 });

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch requests", error: error.message });
  }
};

/**
 * PATCH /api/meetings/:id/respond
 * Accept or decline a meeting request (attendee only).
 */
export const respondToMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "accepted" | "declined"

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.attendee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to respond to this meeting" });
    }

    meeting.status = status;
    await meeting.save();

    res.status(200).json({ message: `Meeting ${status}`, meeting });
  } catch (error) {
    res.status(500).json({ message: "Failed to update meeting", error: error.message });
  }
};

/**
 * DELETE /api/meetings/:id
 * Cancel a meeting (organizer only).
 */
export const cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this meeting" });
    }

    meeting.status = "cancelled";
    await meeting.save();

    res.status(200).json({ message: "Meeting cancelled", meeting });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel meeting", error: error.message });
  }
};