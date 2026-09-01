import express from "express";

import {
    registerUser,
    loginUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    verifyEmail
} from "../controllers/authController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();


// ======================================================
// PUBLIC ROUTES
// ======================================================

router.post(
    "/register",
    registerUser
);

router.post(
    "/login",
    loginUser
);

router.get(
    "/verify-email/:token",
    verifyEmail
);

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/reset-password/:token",
    resetPassword
);


// ======================================================
// PROTECTED ROUTES
// ======================================================

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);


export default router;