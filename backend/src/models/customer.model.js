import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    brokerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Broker",
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
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
    address: {
      type: String,
      required: true,
    },
    notes:{
      type:String,
      required:true,
    }
  },
  { timestamps: true },
);

export const Customer = mongoose.model("Customer", customerSchema);
