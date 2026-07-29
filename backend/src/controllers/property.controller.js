import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { Property } from "../models/property.model";
import { Project } from "../models/project.model";

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
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const existedProperty = await Property.findOne({
    projectId: projectId,
    propertyNumber: propertyNumber,
  });

  if (existedProperty) {
    throw new ApiError(409, "Property number already exists");
  }

  const property = await Property.create({
    projectId,
    propertyNumber,
    propertyType,
    area,
    price,
    status,
  });

  if (!property) {
    throw new ApiError(500, "Unable to create property");
  }
  res
    .status(201)
    .json(new ApiResponse(201, property, "Property created successfully"));
});

const getAllProperties = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const properties = await Property.find({ projectId }).populate(
    "projectId",
    "name",
  );

  if (propertiees.length === 0) {
    throw new ApiError(404, "No properties found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, propertiees, "All properties fetch"));
});

const getPropertyById = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    throw new ApiError(400, "Invalid Id");
  }

  const property = await Property.findById(propertyId).populate({
    path: "projectId",
    select: "name location builder",
    populate: {
      path: "builder",
      select: "name phone",
    },
  });

  if (!property) {
    throw new ApiError(404, "Property  not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, property, "Property information fetch successfully"),
    );
});

const updateProperty = asyncHandler(async (req, res) => {
  const { propertyNumber, propertyType, area, price, status } = req.body;

  const { propertyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    throw new ApiError(400, "Invaid Id");
  }

  if (
    [propertyNumber, propertyType, area, price, status].some(
      (field) => !field || field.toString().trim() === "",
    )
  ) {
    throw new ApiError(400, "All fiels are Required");
  }

  const currentProperty = await Property.findById(propertyId);

  if(!currentProperty){
    throw new ApiError(404,"Property not found")
  }

  const existingProperty = await Property.findOne({
    projectId:currentProperty.projectId,
    propertyNumber,
    _id:{$ne:propertyId}
  })

  if(existingProperty){
    throw new ApiError(409,"Property number already exists in this project")
  }

  const property = await Property.findByIdAndUpdate(
    propertyId,
    { propertyNumber, propertyType, area, price, status },
    { new: true, runValidators: true },
  );

  res
    .status(200)
    .json(new ApiResponse(200, property, "property updated successfully"));
});

const deleteProperty = asyncHandler(async (req, res) => {
  const {propertyId}= req.params

  if(!mongoose.Types.ObjectId.isValid(propertyId)){
    throw new ApiError(400,"Invalid project id")
  }
  
 const property = await Property.findByIdAndDelete(propertyId)

 if(!property){
  throw new ApiError(404,"property not found")
 }

 res.status(200).json(new ApiResponse(200,property,"Property Deleted succesfully"))
});

const updatePropertyStatus = asyncHandler(async (req, res) => {
  const {status} = req.body;
  const {propertyId} = req.params;

  if(!status){
    throw new ApiError(400,"status value required")
  }
  if(!mongoose.Types.ObjectId.isValid(propertyId)){
    throw new ApiError(400,"Invalid id")
  }

  const property=await Property.findByIdAndUpdate(propertyId,{status},{new :true,runValidators:true})

  if(!property){
    throw new ApiError(404,"Property not found")
  }

  res.status(200).json(new ApiResponse(200,property,"Status updated successfully"))

});
