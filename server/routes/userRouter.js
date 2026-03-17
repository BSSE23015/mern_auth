import express from "express";
import { registerUser, verifyotp } from "../controllers/userController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyotp);

export default router;
