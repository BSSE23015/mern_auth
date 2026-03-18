import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./database/dbConnection.js";
import { ErrorMiddleware } from "./middlewares/errorMiddleware.js";
import userRouter from "./routes/userRouter.js";
import { removeUnverifiedUsers } from "./automation/removeUnregisteredUsers.js";

export const app = express();
config({ path: "./config.env" }); //mention the path of config.env file

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST,PUT,DELETE"],
    credentials: true,
  }),
); //middleware to allow cross-origin requests from the frontend URL specified in config.env,and methods and credentials options are set to allow specific HTTP methods and include cookies in cross-origin requests.

app.use(express.json()); //middleware to parse incoming JSON data in request bodies.
app.use(cookieParser()); //middleware to parse cookies from incoming requests, allowing the server to read and manipulate cookies as needed.
app.use(express.urlencoded({ extended: true })); //middleware to parse URL-encoded data from incoming requests, allowing the server to handle form submissions and other URL-encoded data.
app.use("/api/v1", userRouter); //middleware to mount the userRouter on the /api/v1/users path, meaning that any requests to this path will be handled by the routes defined in userRouter.

connectDB();
removeUnverifiedUsers(); //function to schedule a cron job that runs every 30 minutes to remove unverified users from the database. This helps to keep the user database clean and free of inactive accounts that were never verified.
app.use(ErrorMiddleware); //middleware to handle errors that occur during request processing. It captures any errors thrown in the application and sends a structured response to the client, ensuring consistent error handling throughout the server.
//the error middleware is always put at the end of all routes and other middlewares because it needs to catch any errors that occur in those routes and middlewares. If it were placed before them, it would not be able to catch those errors effectively.
