import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broker",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Lead = mongoose.model("Lead", leadSchema);
