import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { Property } from "../models/property.model";

const createProperty = asyncHandler(async (req, res) => {
  const { projectId, propertyNumber, propertyType, area, price, status } =
    req.body;

  if (
    [projectId, propertyNumber, propertyType, area, price, status].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All fiels are Required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Project id is not valid");
  }

  const existedPropertyNumber =await Property.findOne({_id:projectId,propertyNumber:propertyNumber})

  if(existedPropertyNumber){
    throw new ApiError(400,"Property number already exits")
  }

  const property = await Property.create(
    projectId,
    propertyNumber,
    propertyType,
    area,
    price,
    status,
  );

  if (!property) {
    throw new ApiError(500, "Unable to create property");
  }
  res
    .status(201)
    .json(new ApiResponse(201, property, "Property created successfully"));
});

const getAllProperties = asyncHandler(async(req,res) =>{})

const getPropertyById = asyncHandler(async(req,res) => {})

const updateProperty = asyncHandler(async(req,res) => {})

const deleteProperty = asyncHandler (async(req,res) => {})

const updatePropertyStatus = asyncHandler(async(req,res) =>{})
