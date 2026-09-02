import express from "express";

import {
    createConversation,
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


// ==========================================
// CREATE CONVERSATION
// ADMIN / EXHIBITOR
// ==========================================

router.post(
  "/conversations",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  createConversation
);


// ==========================================
// GET MY CONVERSATIONS
// ADMIN / EXHIBITOR
// ==========================================

router.get(
  "/conversations",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  getMyConversations
);


// ==========================================
// GET MESSAGES
// ADMIN / EXHIBITOR
// ==========================================

router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  getConversationMessages
);
// ==========================================
// SEND TEXT MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  sendTextMessage
);

// ==========================================
// SEND IMAGE MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

router.post(
    "/conversations/:conversationId/images",
    authMiddleware,
    authorizeRoles("admin", "exhibitor"),
    chatImageUpload.single("image"),
    sendImageMessage
);

// ==========================================
// SEND AUDIO MESSAGE
// ADMIN / EXHIBITOR
// ==========================================

router.post(
    "/conversations/:conversationId/audio",
    authMiddleware,
    authorizeRoles("admin", "exhibitor"),
    chatAudioUpload.single("audio"),
    sendAudioMessage
);

router.put(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  editMessage
);

router.delete(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  authorizeRoles("admin", "exhibitor"),
  deleteMessage
);

export default router;