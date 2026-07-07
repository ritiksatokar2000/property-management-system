import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name:{
      type:String,
      required:true
    },
    location:{
      type:String,
      required:true
    },
    status:{
      type:Boolean,
      default:true
    },
    description:{
      type:String,
      required:true
    },
    launchDate:{
      type:Date,
      required:true
    },
    builder:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Builder",
      required:true
    },
    createdBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Admin",
      required:true
    }
  },{ timestamps:true}
)

export const Project= mongoose.model("Project",projectSchema)