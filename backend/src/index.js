import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const Port = process.env.PORT || 8000;

app.listen(Port,()=>{
    console.log(`Server is running on port ${Port}`);
})