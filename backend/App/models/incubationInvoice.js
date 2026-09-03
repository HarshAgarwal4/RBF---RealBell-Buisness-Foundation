import mongoose from "mongoose";

const IncubationInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    billingPeriod: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["seat_fee", "infrastructure_booking", "amenities", "security_deposit"],
      default: "seat_fee",
    },
    description: {
      type: String,
      default: "Monthly Dedicated Incubation Seat & Center Infrastructure Access",
    },
    grossAmount: {
      type: Number,
      required: true,
      default: 6500,
    },
    grantSubsidyAmount: {
      type: Number,
      default: 6500,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Grant Settled", "Paid", "Pending", "Cancelled"],
      default: "Grant Settled",
      index: true,
    },
    receiptUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const IncubationInvoiceModel = mongoose.model("IncubationInvoice", IncubationInvoiceSchema);
export default IncubationInvoiceModel;
