import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found."
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated."
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};

export default authMiddleware;