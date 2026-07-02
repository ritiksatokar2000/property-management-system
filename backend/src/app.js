import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// import Router
import adminRouter from "./routes/admin.route.js"

//routes

app.use("/api/v1/admin",adminRouter)

export default app;