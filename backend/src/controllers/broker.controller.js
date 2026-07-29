import mongoose from "mongoose";
import { Broker } from "../models/broker.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessAndRefreshToken } from "../utils/generateToken";
import { Lead } from "../models/lead.model";

const loginBroker = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password is required");
  }

  const broker = await Broker.findOne({ email });

  if (!broker) {
    throw new ApiError(400, "broker not found");
  }

  const isPasswordCorrect = await broker.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(broker);

  const loggedInBroker = await Broker.findById(broker._id).select(
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
        { broker: loggedInBroker, accessToken, refreshToken },
        "broker logged in successfully",
      ),
    );
});

const logoutBroker = asyncHandler(async (req, res) => {
  await Broker.findByIdAndUpdate(
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
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Broker logout successfully"));
});

const refreshBrokerAccessToken = asyncHandler(async (req, res) => {
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

    const broker = await Broker.findById(decodedToken?._id);

    if (!broker) {
      throw new ApiError(404, "Invalid refreshToken");
    }

    if (incomingRefreshToken !== broker?.refreshToken) {
      throw new ApiError(401, "refresh token expire");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(broker);

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
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

const getCurrentBroker = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Current broker fetched successfully"),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (
    [oldPassword, newPassword].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const broker = await Broker.findById(req.user._id);

  if (!broker) {
    throw new ApiError(404, "Broker not found");
  }

  const isPasswordCorrect = await broker.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  broker.password = newPassword;

  await broker.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const updateBrokerProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (
    [name, email, phone].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All feild are required");
  }

  const existingBroker = await Broker.findOne({
    $or: [{ email }, { phone }],
    _id: { $ne: req.user._id },
  });

  if (existingBroker) {
    throw new ApiError(409, "Email or phone aready exists");
  }

  const broker = await Broker.findByIdAndUpdate(
    req.user._id,
    {
      name,
      email,
      phone,
    },
    { new: true, runValidators: true },
  ).select("-password -refreshToken");

  if (!broker) {
    throw new ApiError(504, "Something Went wrong");
  }

  res.status(200).json(new ApiResponse(200, broker, "Broker updated"));
});

//Business Logic

const getAssignedLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find({ brokerId: req.user._id }).populate({
    path: "projectId",
    select: "name builder",
    populate: {
      path: "builder",
      select: "name",
    },
  });

  if (leads.length === 0) {
    throw new ApiError(404, "No Leads found");
  }

  res.status(200).json(new ApiResponse(200, leads, "All lead are fetch"));
});

const getAssignedLeadById = asyncHandler(async (req, res) => {
  const { leadId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "Invalid Lead id");
  }

  const lead = await Lead.findOne({
    _id: leadId,
    brokerId: req.user._id,
  }).populate({
    path: "projectId",
    select: "name location status launchDate builder",
    populate: {
      path: "builder",
      select: "name contactEmail phone",
    },
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, lead, "lead information fetch succesfully"));
});

const updateAssignedLeadStatus = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "Invalid Id");
  }
  if (!status) {
    throw new ApiError(400, "Status is not valid");
  }

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, brokerId: req.user._id },
    { status },
    { new: true, runValidators: true },
  );

  if (!lead) {
    throw new ApiError(404, "Something Went wrong");
  }

  res
    .status(200)
    .json(new ApiResponse(200, lead, "Status updated succcesfully"));
});

const updateAssignedLeadNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const { leadId } = req.params;

  if (!notes) {
    throw new ApiError(400, "Notes is required");
  }

  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new ApiError(400, "Id is not valid");
  }

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, brokerId: req.user._id },
    { notes },
    { new: true },
  );

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, lead, "Note is updated succesfully"));
});
