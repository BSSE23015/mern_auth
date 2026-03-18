import express from "express";
import {
  registerUser,
  verifyotp,
  login,
  logout,
  getMyProfile,
  resetPassword,
  forgotPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyotp);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getMyProfile);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword); //token or whatever u have specified in the route, it should be same as the one in the controller
export default router;
