import "dotenv/config";

import express from "express";
import dns from "node:dns";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./src/config/db.mjs";
import authRoutes from "./src/routes/authRoutes.mjs";
import exhibitorRoutes from "./src/routes/exhibitorRoutes.mjs";
import eventRoutes from "./src/routes/eventRoutes.mjs";
import registrationRoutes from "./src/routes/registrationRoutes.mjs";
import exhibitorParticipationRoutes from "./src/routes/exhibitorParticipationRoutes.mjs";
import dashboardRoutes from "./src/routes/dashboardRoutes.mjs";
import favoriteRoutes from "./src/routes/favoriteRoutes.mjs";
import notificationRoutes from "./src/routes/notificationRoutes.mjs";
import boothRoutes from "./src/routes/boothRoutes.mjs";
import sessionRoutes from "./src/routes/sessionRoutes.mjs";
import sessionRegistrationRoutes from "./src/routes/sessionRegistrationRoutes.mjs";
import boothVisitRoutes from "./src/routes/boothVisitRoutes.mjs";
import feedbackRoutes from "./src/routes/feedbackRoutes.mjs";
import analyticsRoutes from "./src/routes/analyticsRoutes.mjs";
import reportRoutes from "./src/routes/reportRoutes.mjs";
import profileRoutes from "./src/routes/profileRoutes.mjs";
import chatRoutes from "./src/routes/chatRoutes.mjs";
import initializeChatSocket from "./src/sockets/chatSocket.mjs";
import { setSocketIO } from "./src/config/socket.mjs";
import aiRoutes from "./src/routes/aiRoutes.mjs";
import organizerApplicationRoutes from "./src/routes/organizerApplicationRoutes.mjs";
import organizerRouter from "./src/routes/organizerRoutes.mjs";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setSocketIO(io);
initializeChatSocket(io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "src", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/exhibitors", exhibitorRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/exhibitor-participation", exhibitorParticipationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/booths", boothRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/session-registrations", sessionRegistrationRoutes);
app.use("/api/booth-visits", boothVisitRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/organizer-applications", organizerApplicationRoutes);
app.use("/api/organizers", organizerRouter);

app.get("/", (req, res) => {
  res.json({
    message: "EventSphere API is running!",
  });
});

// Start server after MongoDB connection
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
