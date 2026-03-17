import express from "express";
import {
  registerUser,
  verifyotp,
  login,
} from "../controllers/userController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyotp);
router.post("/login", login);
export default router;
