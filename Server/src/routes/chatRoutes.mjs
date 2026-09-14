import express from "express";

import {
    createConversation,
    getChatContacts,
    getMyConversations,
    getConversationMessages,
    sendTextMessage,
    sendImageMessage,
    sendAudioMessage,
    editMessage,
    deleteMessage
} from "../controllers/chatController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";
import chatImageUpload from "../middleware/chatImageUpload.mjs";
import chatAudioUpload from "../middleware/chatAudioUpload.mjs";

const router = express.Router();

router.get(
  "/contacts",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  getChatContacts
);


// ==========================================
// CREATE CONVERSATION
// ADMIN / EXHIBITOR
// ==========================================

router.post(
  "/conversations",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  createConversation
);


// ==========================================
// GET MY CONVERSATIONS
// ADMIN / EXHIBITOR
// ==========================================

router.get(
  "/conversations",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  getMyConversations
);


// ==========================================
// GET MESSAGES
// ADMIN / EXHIBITOR
// ==========================================

router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  getConversationMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  sendTextMessage
);

router.post(
    "/conversations/:conversationId/images",
    authMiddleware,
    authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
    chatImageUpload.single("image"),
    sendImageMessage
);

router.post(
    "/conversations/:conversationId/audio",
    authMiddleware,
    authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
    chatAudioUpload.single("audio"),
    sendAudioMessage
);

router.put(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  editMessage
);

router.delete(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  authorizeRoles("admin", "organizer", "exhibitor", "attendee"),
  deleteMessage
);

export default router;
