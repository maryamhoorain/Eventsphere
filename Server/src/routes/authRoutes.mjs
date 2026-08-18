import express from "express";
import {
    registerUser,
    loginUser,
    getCurrentUser
} from "../controllers/authController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route
router.get("/me", authMiddleware, getCurrentUser);


export default router;