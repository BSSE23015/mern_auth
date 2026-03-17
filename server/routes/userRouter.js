import express from "express";
import {
  registerUser,
  verifyotp,
  login,
  logout,
  getMyProfile,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyotp);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getMyProfile);
export default router;
