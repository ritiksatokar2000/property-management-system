import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Admin } from "../models/admin.model";
import { Broker } from "../models/broker.model";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    let user = null;

    if(decodedToken.role ==="admin"){
      user = await Admin.findById(decodedToken?._id).select("-password -refreshToken")
    }else if(decodedToken.role ==="broker"){
     user = await Broker.findById(decodedToken?._id).select("-password -refreshToken")
    }

    if(!user){
      throw new ApiError(401,"Unauthorized request")
    }

    req.user = {
      ...user.toObject(),
      role:decodedToken.role,
    }

  
    next();
  } catch (error) {
    throw new ApiError(401,"Invaild access token")
  }
});
