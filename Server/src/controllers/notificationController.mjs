import Notification from "../models/Notification.mjs";


// ==========================================
// GET MY NOTIFICATIONS
// ==========================================

const getMyNotifications = async (req, res) => {
    try {

        const notifications =
            await Notification.find({
                recipient: req.user._id
            })
                .populate(
                    "relatedEvent",
                    "title startDate endDate bannerImage"
                )
                .sort({
                    createdAt: -1
                });

        const unreadCount =
            await Notification.countDocuments({
                recipient: req.user._id,
                isRead: false
            });

        res.status(200).json({
            count: notifications.length,
            unreadCount,
            notifications
        });

    } catch (error) {

        console.error(
            "Get notifications error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET UNREAD NOTIFICATIONS
// ==========================================

const getUnreadNotifications = async (req, res) => {
    try {

        const notifications =
            await Notification.find({
                recipient: req.user._id,
                isRead: false
            })
                .populate(
                    "relatedEvent",
                    "title startDate endDate bannerImage"
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json({
            count: notifications.length,
            notifications
        });

    } catch (error) {

        console.error(
            "Get unread notifications error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// MARK ONE AS READ
// ==========================================

const markNotificationAsRead = async (req, res) => {
    try {

        const { id } = req.params;

        const notification =
            await Notification.findOne({
                _id: id,
                recipient: req.user._id
            });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            message:
                "Notification marked as read",
            notification
        });

    } catch (error) {

        console.error(
            "Mark notification read error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// MARK ALL AS READ
// ==========================================

const markAllNotificationsAsRead = async (req, res) => {
    try {

        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        res.status(200).json({
            message:
                "All notifications marked as read"
        });

    } catch (error) {

        console.error(
            "Mark all notifications read error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// DELETE NOTIFICATION
// ==========================================

const deleteNotification = async (req, res) => {
    try {

        const { id } = req.params;

        const notification =
            await Notification.findOneAndDelete({
                _id: id,
                recipient: req.user._id
            });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message:
                "Notification deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete notification error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

// ==========================================
// GET UNREAD NOTIFICATION COUNT
// ==========================================

const getUnreadNotificationCount = async (req, res) => {
    try {

        const count =
            await Notification.countDocuments({
                recipient: req.user._id,
                isRead: false
            });

        res.status(200).json({
            count
        });

    } catch (error) {

        console.error(
            "Get unread notification count error:",
            error.message
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};

export {
    getMyNotifications,
    getUnreadNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};