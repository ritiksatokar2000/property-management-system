import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    phone: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function (){
  return jwt.sign({
    _id:this.id,
    email:this.email,
    name:this.username,
    role:this.role
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
  }
)
}

adminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const Admin = mongoose.model("Admin",adminSchema)