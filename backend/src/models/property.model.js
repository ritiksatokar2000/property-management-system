import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  propertyNumber: {
    type: String,
    required: true,
  },
  propertyType: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "in_discussion", "reserved", "sold"],
    default: "available",
  },
});

export const Property = mongoose.model("Property", propertySchema);
