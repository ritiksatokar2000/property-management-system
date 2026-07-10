import mongoose from "mongoose";

const builderSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  contactEmail:{
    type:String,
    required:true
  },
  phone:{
    type:String,
    required:true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Admin",
    required:true
  }
}, {timestamps:true});

export const Builder= mongoose.model("Builder", builderSchema)
