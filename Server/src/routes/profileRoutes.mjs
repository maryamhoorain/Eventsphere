import express from "express";

import {
    getProfile,
    updateProfile,
    changeUserPassword,
    updateProfileImageController,
    changeEmail
} from "../controllers/profileController.mjs";

import authMiddleware
    from "../middleware/authMiddleware.mjs";


const profileRouter =
    express.Router();


// ======================================================
// GET MY PROFILE
// ======================================================

profileRouter.get(
    "/",
    authMiddleware,
    getProfile
);


// ======================================================
// UPDATE MY PROFILE
// ======================================================

profileRouter.put(
    "/",
    authMiddleware,
    updateProfile
);


// ======================================================
// CHANGE PASSWORD
// ======================================================

profileRouter.put(
    "/password",
    authMiddleware,
    changeUserPassword
);


// ======================================================
// UPDATE PROFILE IMAGE
// ======================================================

profileRouter.put(
    "/image",
    authMiddleware,
    updateProfileImageController
);

// CHANGE EMAIL
profileRouter.put(
    "/email",
    authMiddleware,
    changeEmail
);



export default profileRouter;