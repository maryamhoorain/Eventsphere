import {
    getMyProfile,
    updateMyProfile,
    changePassword,
    updateProfileImage
} from "../services/profileService.mjs";

import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
// ======================================================
// GET MY PROFILE
// ======================================================

const getProfile = async (req, res) => {

    try {

        const user =
            await getMyProfile(
                req.user._id
            );


        res.status(200).json({

            message:
                "Profile fetched successfully",

            user

        });

    } catch (error) {

        console.error(
            "Get profile error:",
            error.message
        );


        if (
            error.message ===
            "User not found"
        ) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// UPDATE MY PROFILE
// ======================================================

const updateProfile = async (req, res) => {

    try {

        const {
            name,
            phone
        } = req.body;


        if (
            name === undefined &&
            phone === undefined
        ) {

            return res.status(400).json({

                message:
                    "At least one profile field is required"

            });

        }


        const user =
            await updateMyProfile({

                userId:
                    req.user._id,

                name,

                phone

            });


        res.status(200).json({

            message:
                "Profile updated successfully",

            user

        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error.message
        );


        if (
            error.message ===
            "User not found"
        ) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// CHANGE PASSWORD
// ======================================================

const changeUserPassword = async (req, res) => {

    try {

        const {
            currentPassword,
            newPassword
        } = req.body;


        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Current password and new password are required"

            });

        }


        const result =
            await changePassword({

                userId:
                    req.user._id,

                currentPassword,

                newPassword

            });


        res.status(200).json(result);

    } catch (error) {

        console.error(
            "Change password error:",
            error.message
        );


        if (
            error.message ===
            "User not found"
        ) {

            return res.status(404).json({
                message:
                    "User not found"
            });

        }


        if (
            error.message ===
            "Current password is incorrect"
        ) {

            return res.status(401).json({
                message:
                    error.message
            });

        }


        if (
            error.message.includes(
                "at least 6 characters"
            )
        ) {

            return res.status(400).json({
                message:
                    error.message
            });

        }


        res.status(500).json({
            message:
                "Server error"
        });

    }

};


// ======================================================
// UPDATE PROFILE IMAGE
// ======================================================

const updateProfileImageController =
    async (req, res) => {

        try {

            const {
                imageUrl
            } = req.body;


            if (!imageUrl) {

                return res.status(400).json({

                    message:
                        "Profile image URL is required"

                });

            }


            const user =
                await updateProfileImage({

                    userId:
                        req.user._id,

                    imageUrl

                });


            res.status(200).json({

                message:
                    "Profile image updated successfully",

                user

            });

        } catch (error) {

            console.error(
                "Update profile image error:",
                error.message
            );


            if (
                error.message ===
                "User not found"
            ) {

                return res.status(404).json({
                    message:
                        "User not found"
                });

            }


            res.status(500).json({
                message:
                    "Server error"
            });

        }

    };
// ======================================================
// CHANGE EMAIL
// ======================================================

const changeEmail = async (req, res) => {
    try {

        const userId = req.user._id;

        const {
            currentPassword,
            newEmail
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!currentPassword) {
            return res.status(400).json({
                message: "Current password is required"
            });
        }

        if (!newEmail) {
            return res.status(400).json({
                message: "New email is required"
            });
        }


        // ==========================================
        // FIND USER
        // ==========================================

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // ==========================================
        // VERIFY CURRENT PASSWORD
        // ==========================================

        const isPasswordCorrect =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }


        // ==========================================
        // NORMALIZE NEW EMAIL
        // ==========================================

        const normalizedEmail =
            newEmail.trim().toLowerCase();


        // ==========================================
        // CHECK IF SAME EMAIL
        // ==========================================

        if (normalizedEmail === user.email) {
            return res.status(400).json({
                message:
                    "New email must be different from your current email"
            });
        }


        // ==========================================
        // CHECK EMAIL FORMAT
        // ==========================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }


        // ==========================================
        // CHECK EMAIL ALREADY EXISTS
        // ==========================================

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(409).json({
                message:
                    "This email is already registered"
            });
        }


        // ==========================================
        // UPDATE EMAIL
        // ==========================================

        user.email = normalizedEmail;

        await user.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            message:
                "Email updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }

        });

    } catch (error) {

        console.error(
            "Change email error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

export {
    getProfile,
    updateProfile,
    changeUserPassword,
    updateProfileImageController,
    changeEmail
};