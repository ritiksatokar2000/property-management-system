import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";
import { generateAccessAndRefreshToken } from "../utils/generateToken.js";

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

export { registerAdmin, loginAdmin };
