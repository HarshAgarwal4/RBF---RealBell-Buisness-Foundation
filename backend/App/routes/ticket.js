import express from "express";
import { createUploadMiddleware } from "../../services/upload.js";
import {
  createTicket,
  deleteTicket,
  getTicketById,
  getTickets,
  updateTicket,
} from "../controllers/ticket.js";

const ticketRoutes = express.Router();

const ticketUpload = createUploadMiddleware({
  maxFileSize: 25 * 1024 * 1024,
});

ticketRoutes.get("/", getTickets);
ticketRoutes.post("/", ticketUpload.array("attachments", 8), createTicket);
ticketRoutes.get("/:id", getTicketById);
ticketRoutes.put("/:id", ticketUpload.array("attachments", 8), updateTicket);
ticketRoutes.delete("/:id", deleteTicket);

export default ticketRoutes;
