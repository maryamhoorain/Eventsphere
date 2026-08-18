import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.mjs";
import User from "../models/User.mjs";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const createAdmin = async () => {
    try {
        // Connect using our existing DB configuration
        await connectDB();

        const adminEmail = "admin@eventsphere.com";
        const adminPassword = "admin123";

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin
        const admin = await User.create({
            name: "EventSphere Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        console.log("Admin created successfully");

        console.log({
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

    } catch (error) {
        console.error("Error creating admin:", error.message);

    } finally {
        process.exit(0);
    }
};

createAdmin();