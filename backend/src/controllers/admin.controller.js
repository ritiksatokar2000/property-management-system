import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { generateAccessAndRefreshToken } from "../utils/generateToken.js";
import { Broker } from "../models/broker.model.js";
import { Builder } from "../models/builder.model.js";
import { Project } from "../models/project.model.js";

const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (
    [name, email, phone, password].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All feilds are required");
  }

  const existedAdmin = await Admin.findOne({
    $or: [{ email }, { phone }],
  });

  if (existedAdmin) {
    throw new ApiError(409, "Admin already existe");
  }

  const admin = await Admin.create({
    name,
    email,
    phone,
    password,
  });

  const createAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken",
  );

  if (!createAdmin) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createAdmin, "Admin registed succsfully"));
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    throw new ApiError(400, "Email and Password required");
  }

  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new ApiError(404, "Admin not exist");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Password");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(admin);

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { admin: loggedInAdmin, accessToken, refreshToken },
        "user logged in successfully",
      ),
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const admin = await Admin.findById(decodedToken?._id);

    if (!admin) {
      throw new ApiError(404, "invalide refresh Token");
    }

    if (incomingRefreshToken !== admin?.refreshToken) {
      throw new ApiError(401, "refresh TOken expire");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(admin);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "AccessToken refreshed successfully",
        ),
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

const getCurrentAdmin = asyncHandler(async (req, res) => {});

const updateAdminProfile = asyncHandler(async (req, res) => {});

const changeCurrentPassword = asyncHandler(async (req, res) => {});

//Broker Managemnet

const registerBroker = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (
    [name, email, phone, password].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All feild are required");
  }

  const existedBroker = await Broker.findOne({
    $or: [{ email }, { phone }],
  });

  if (existedBroker) {
    throw new ApiError(409, "Broker already exist");
  }

  const broker = await Broker.create({
    name,
    email,
    phone,
    password,
    isActive: true,
    createdBy: req.user?._id,
  });

  const createdBroker = await Broker.findById(broker._id).select(
    "-password -refreshToken",
  );

  if (!createdBroker) {
    throw new ApiError(500, "Faile to creat broker");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdBroker, "Broker created Successfully"));
});

const getAllBroker = asyncHandler(async (req, res) => {
  const allBroker = await Broker.find({}).select("-password -refreshToken");

  if (allBroker.length === 0) {
    throw new ApiError(404, "No broker found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, allBroker, "All broker fetch"));
});

const getBrokerById = asyncHandler(async (req, res) => {
  const { brokerId } = req.params;

  if (!brokerId) {
    throw new ApiError(400, "not a valid id");
  }

  if (!mongoose.Types.ObjectId.isValid(brokerId)) {
    throw new ApiError(400, "not a valid id");
  }

  const broker = await Broker.findById(brokerId).select(
    "-password -refreshToken",
  );

  if (!broker) {
    throw new ApiError(400, "Id is invaalide");
  }

  return res.status(200).json(new ApiResponse(200, broker, "Broker found"));
});

const updateBroker = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const { brokerId } = req.params;

  if (!brokerId) {
    throw new ApiError(400, "broker id is missing");
  }

  if ([name, phone].some((field) => !field || field.toString().trim() === "")) {
    throw new ApiError(400, "all Fields are required");
  }

  const broker = await Broker.findByIdAndUpdate(
    brokerId,
    {
      $set: { name, phone },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!broker) {
    throw new ApiError(500, "Faild to update");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, broker, "broker details are updated"));
});

const updateBrokerStatus = asyncHandler(async (req, res) => {
  const { brokerId } = req.params;
  if (!brokerId) {
    throw new ApiError(400, "id not found");
  }
  if (!mongoose.Types.ObjectId.isValid(brokerId)) {
    throw new ApiError(400, "Invalid id");
  }

  const broker = await Broker.findById(brokerId);

  if (!broker) {
    throw new ApiError(404, "invalid id");
  }

  const status = (broker.isActive = !broker.isActive);

  await broker.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, broker, "Status updated"));
});

const deleteBroker = asyncHandler(async (req, res) => {
  const { brokerId } = req.params;

  if (!brokerId) {
    throw new ApiError(404, "Is not found");
  }

  if (!mongoose.Types.ObjectId.isValid(brokerId)) {
    throw new ApiError(400, "Invalid id");
  }

  const broker = await Broker.findByIdAndDelete(brokerId);

  if (!broker) {
    throw new ApiError(404, "Broker not found");
  }

  return res.status(200).json(new ApiResponse(200, broker, "broker deleted"));
});

// Builder Managemnet

const createBuilder = asyncHandler(async (req, res) => {
  const { name, contactEmail, phone } = req.body;

  if (
    [name, contactEmail, phone].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const builderExist = await Builder.findOne({
    $or: [{ contactEmail }, { phone }],
  });

  if (builderExist) {
    throw new ApiError(400, "BUilder already exists");
  }

  const builder = await Builder.create({
    name,
    contactEmail,
    phone,
    createdBy: req.user._id,
  });

  if (!builder) {
    throw new ApiError(500, "Failed to create Builder");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, builder, "Builder created successfully"));
});

const getAllBuilders = asyncHandler(async (req, res) => {
  const allBuilder = await Builder.find();

  if (allBUilder.length === 0) {
    throw new ApiError(404, "not builder found");
  }

  return res.status(200).json(200, allBuilder, "All builder fetch");
});

const getBuilderById = asyncHandler(async (req, res) => {
  const { builderId } = req.params;

  if (!builderId) {
    throw new ApiError(400, "Builder is not given");
  }

  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new ApiError(400, "not a valid builder id");
  }

  const builder = await Builder.findById(builderId);

  if (!builder) {
    throw new ApiError(400, "builder not found");
  }

  return res.status(200).json(200, builder, "Builder is found");
});

const updateBuilder = asyncHandler(async (req, res) => {
  const { name, contactEmail, phone } = req.body;
  const { builderId } = req.params;

  if (
    [name, contactEmail, phone].some(
      (feild) => !feild || feild.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "Alfeild are required");
  }

  const existedEmail = await Builder.findOne({
    contactEmail,
    _id: { $ne: builderId },
  });

  if (existedEmail) {
    throw new ApiError(400, "email already exite");
  }

  const builder = await Builder.findByIdAndUpdate(
    builderId,
    { name, contactEmail, phone },
    { new: true },
  );

  if (!builder) {
    throw new ApiError(400, "failed to update builder");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, builder, "builder updated successfully"));
});

const deleteBuilder = asyncHandler(async (req, res) => {
  const { builderId } = req.params;

  if (!builderId) {
    throw new ApiError(400, "id not found");
  }

  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new ApiError(400, "invalid id");
  }

  const deletedBuilder = await Builder.findByIdAndDelete(builderId);

  if (!deletedBuilder) {
    throw new ApiError(404, "Builder not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedBuilder, "deleted Builder"));
});

//Project Management

const createProject = asyncHandler(async (req, res) => {
  const { name, location, description, launchDate, builderId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(builderId)) {
    throw new ApiError(400, "invalid builder id");
  }

  if (
    [name, location, description, launchDate].some(
      (feild) => !feild || feild.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "all feild are required");
  }

  const projectExist = await Project.findOne({
    $or: [{ name }],
  });

  if (projectExist) {
    throw new ApiError(409, "Project Already exists");
  }

  const builder = await Builder.findById(builderId);

  if (!builder) {
    throw new ApiError(404, "Builder not found");
  }

  const project = await Project.create({
    name,
    location,
    description,
    launchDate,
    builder: builder._id,
    createdBy: req.user._id,
  });

  if (!project) {
    throw new ApiError(500, "failed to create project");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, project, "project created successfully"));
});

const getAllProjects = asyncHandler(async (req, res) => {
  const allProject = await Project.find().populate("builder","name contactEmail phone");

  if (allProject.length === 0) {
    throw new ApiError(400, "no Record");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allProject, "all project fetch"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid Project id");
  }

  const project = await Project.findById(projectId).populate("builder","name contactEmail phone createdBy");

  if (!project) {
    throw new ApiError(404, "unable to fetch project data");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Data fetch successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, location, description, launchDate, builderId } = req.body;
  const { projectId } = req.params;

  if(!mongoose.Types.ObjectId.isValid(projectId)){
    throw new ApiError(400,"Invalid project id")
  }

  if(!mongoose.Types.ObjectId.isValid(builderId)){
    throw new ApiError(400,"Invalid builder id")
  }

  if (
    [name, location, description, launchDate, builderId].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const project = await Project.findById(projectId)

  if(!project){
    throw new ApiError(404,"Project not found")
  }

  const existingProject = await Project.findOne({ name, _id: { $ne: projectId } });

  if(existingProject){
    throw new ApiError(400,"project name already exists")
  }

  const builder = await Builder.findById(builderId)

  if(!builder){
    throw new ApiError(404,"Builder not found")
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { name, location, description, launchDate, builder:builderId },
    { new: true, runValidators:true },
  ).populate("builder","name contactEmail phone");

  if(!updatedProject){
    throw new ApiError(500,"Failed to update Project")
  }

  return res.status(200).json(new ApiResponse(200,updatedProject,"Project updated successfully"))

});

const deleteProject = asyncHandler(async (req, res) => {
  const {projectId} = req.params;

  if(!mongoose.Types.ObjectId.isValid(projectId)){
    throw new ApiError(400,"invalid project id")
  }

  const deletedProject = await Project.findByIdAndDelete(projectId)
   
  if(!deletedProject){
    throw new ApiError(404,"Failed to delete Project")
  }

  return res.status(200).json(new ApiResponse(200,deletedProject,"Project deleted successfully"))
});

// Dashboard

const getDashboardSummary = asyncHandler(async (req, res) => {});

const getRecentLeads = asyncHandler(async (req, res) => {});

const getRecentSales = asyncHandler(async (req, res) => {});

export { registerAdmin, loginAdmin };
