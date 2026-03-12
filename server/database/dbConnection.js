import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected successfully.");
  } catch (err) {
    console.log("Database connection failed.");
    console.log(err);
    process.exit(1); // ← stops the server if DB fails to connect
  }
};
