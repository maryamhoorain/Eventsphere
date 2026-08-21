import express from "express";
import {
    getMyNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from "../controllers/notificationController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";

const router = express.Router();


// Get all my notifications
router.get(
    "/",
    authMiddleware,
    getMyNotifications
);


// Get unread notifications
router.get(
    "/unread",
    authMiddleware,
    getUnreadNotifications
);


// Get unread notification count

router.get(
    "/unread/count",
    authMiddleware,
    getUnreadNotificationCount
);

// Mark all as read
router.patch(
    "/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);

// Mark one as read
router.patch(
    "/:id/read",
    authMiddleware,
    markNotificationAsRead
);


// Delete notification
router.delete(
    "/:id",
    authMiddleware,
    deleteNotification
);


export default router;