import Notification from "../models/Notification.mjs";

const createNotification = async ({
    recipient,
    title,
    message,
    type,
    relatedEvent = null
}) => {
    try {
        const notification =
            await Notification.create({
                recipient,
                title,
                message,
                type,
                relatedEvent
            });

        return notification;

    } catch (error) {

        console.error(
            "Create notification error:",
            error.message
        );

        return null;
    }
};

export default createNotification;