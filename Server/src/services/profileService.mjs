import bcrypt from "bcryptjs";
import User from "../models/User.mjs";


// ======================================================
// GET MY PROFILE
// ======================================================

const getMyProfile = async (userId) => {

    const user = await User.findById(userId)
        .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};


// ======================================================
// UPDATE MY PROFILE
// ======================================================

const updateMyProfile = async ({
    userId,
    name,
    phone
}) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }


    // ==========================================
    // UPDATE ALLOWED FIELDS ONLY
    // ==========================================

    if (name !== undefined) {
        user.name = name;
    }

    if (phone !== undefined) {
        user.phone = phone;
    }


    await user.save();


    // ==========================================
    // REMOVE SENSITIVE INFORMATION
    // ==========================================

    user.password = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;


    return user;
};


// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async ({
    userId,
    currentPassword,
    newPassword
}) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
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
        throw new Error("Current password is incorrect");
    }


    // ==========================================
    // VALIDATE NEW PASSWORD
    // ==========================================

    if (!newPassword || newPassword.length < 6) {
        throw new Error(
            "New password must be at least 6 characters"
        );
    }


    // ==========================================
    // HASH NEW PASSWORD
    // ==========================================

    const hashedPassword =
        await bcrypt.hash(
            newPassword,
            10
        );


    user.password =
        hashedPassword;


    await user.save();


    return {
        message: "Password changed successfully"
    };
};


// ======================================================
// UPDATE PROFILE IMAGE
// ======================================================

const updateProfileImage = async ({
    userId,
    imageUrl
}) => {

    const user =
        await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }


    user.profileImage =
        imageUrl;


    await user.save();


    user.password = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;


    return user;
};


export {
    getMyProfile,
    updateMyProfile,
    changePassword,
    updateProfileImage
};