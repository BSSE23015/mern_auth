import ErrorHandler from "./errorMiddleware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the secret key defined in your environment variables. If the token is valid, it will decode the token and return the payload (which contains only the user's ID in this case). If the token is invalid or expired, it will throw an error.
  req.user = await User.findById(decoded.id); // After decoding the token, it retrieves the user's information from the database using the ID obtained from the decoded token. The user's information is then attached to the req object (req.user) for use in subsequent middleware or route handlers.
  next();
};
