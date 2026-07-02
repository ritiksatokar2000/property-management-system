import { ApiError } from "../utils/ApiError";

export const authorize = (...roles) => {
  return(req, res, next) => {
    if(!roles.includes(req.user.role)){
      throw new ApiError(403,"You are not authorizes to access this resource")
    }
  }
}