import express from "express";
import dotenv from "dotenv";
import dns from "node:dns";
import connectDB from "./src/config/db.mjs";
import authRoutes from "./src/routes/authRoutes.mjs";
import exhibitorRoutes from "./src/routes/exhibitorRoutes.mjs";
import eventRoutes from "./src/routes/eventRoutes.mjs";
import registrationRoutes from "./src/routes/registrationRoutes.mjs";
import exhibitorParticipationRoutes from "./src/routes/exhibitorParticipationRoutes.mjs";
import dashboardRoutes from "./src/routes/dashboardRoutes.mjs";
import favoriteRoutes from "./src/routes/favoriteRoutes.mjs";
import notificationRoutes from "./src/routes/notificationRoutes.mjs";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/exhibitors", exhibitorRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/exhibitor-participation", exhibitorParticipationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "EventSphere API is running!",
  });
});

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
