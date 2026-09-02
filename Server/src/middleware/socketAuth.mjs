import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

const socketAuth = async (socket, next) => {
    try {
        // Get token sent by Socket.IO client
        const token = socket.handshake.auth?.token;

        // Check if token exists
        if (!token) {
            return next(
                new Error("Authentication token is required")
            );
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user using the SAME field
        // used by your REST authMiddleware
        const user = await User.findById(decoded.userId)
            .select("_id name email role isActive");

        if (!user) {
            return next(
                new Error("User not found")
            );
        }

        // Check account status
        if (!user.isActive) {
            return next(
                new Error("Your account has been deactivated")
            );
        }

        // Attach authenticated user to socket
        socket.user = user;

        // Authentication successful
        next();

    } catch (error) {

        console.error(
            "Socket authentication error:",
            error.message
        );

        next(
            new Error("Invalid or expired token")
        );
    }
};

export default socketAuth;