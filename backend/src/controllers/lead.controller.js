import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Lead } from "../models/lead.model";
import { ApiResponse } from "../utils/ApiResponse";
import { getNextBroker } from "../service/roundRobin.service";
import mongoose from "mongoose";

const createLeads = asyncHandler(async (req, res) => {
  const { name, email, phone, source, status, notes, projectId } = req.body;

  if (
    [name, email, phone, source, status, notes].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All field is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }
  const broker = await getNextBroker();
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const lead = await Lead.create({
    name,
    email,
    phone,
    source,
    status,
    notes,
    brokerId: broker._id,
    projectId: project._id,
  });

  const createLead = await Lead.findById(lead._id)
    .populate("broker", "name phone")
    .populate("project", "name");

  if (!createLead) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createLead, "Lead created succsfully"));
});

const getAllLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find();

  if (leads.length === 0) {
    throw new ApiError(400, "no leads found");
  }

  res.status(200).json(new ApiResponse(200, leads, "al leads are fetch"));
});

const getLeadById = asyncHandler(async (req, res) => {
  const {leadId }= req.params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "invalid lead id");
  }

  const lead = await Lead.findById(leadId).populate("brokerId","name phone").populate("projectId","name");

  if(!lead){
    throw new ApiError(404,"Lead not found")
  }
  res
    .status(200)
    .json(new ApiResponse(200, lead, "lead information fetch succesfully"));
});
const updateLead = asyncHandler(async (req, res) => {
  const { name, email, phone, source, status, notes, projectId } = req.body;
  const {leadId }= req.params;

  if (
    [name, email, phone, source, status, notes].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All field is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "Invalid lead id");
  }

  const updateLead = await Lead.findByIdAndUpdate(
    leadId ,
    { name, email, phone, source, status, notes, projectId },
    { new: true },
  );

  res
    .status(200)
    .json(new ApiResponse(200, updateLead, "Lead updated successfully"));
});
const deleteLead = asyncHandler(async (req, res) => {
  const {leadId} = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "invalid id");
  }
  const deleteLead = await Lead.findByIdAndDelete(leadId);

  if(!deleteLead){
    throw new ApiError(404,"id not found")
  }

  res.status(200).json(new ApiResponse(200, deleteLead, "lead deleted"));
});

const updateLeadStatus = asyncHandler(async (req, res) => {
  const {status} = req.body;
  const {leadId} = req.params;
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "invalid id");
  }

  if (!status) {
    throw new ApiError(400, "status is not avalible");
  }

  const updateStatus = await Lead.findByIdAndUpdate(leadId, { status },{new:true});

  res
    .status(200)
    .json(new ApiResponse(200, updateStatus, "status updated successfuly"));
});
