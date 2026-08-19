import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);
// Protected route
router.get("/me", authMiddleware, getCurrentUser);

export default router;
