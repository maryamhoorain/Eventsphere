import express from "express";

import {
  createConversation,
  getMyConversations,
  getConversationMessages,
  sendTextMessage,
  sendImageMessage,
  sendAudioMessage,
  editMessage,
  deleteMessage,
} from "../controllers/chatController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import authorizeRoles from "../middleware/roleMiddleware.mjs";
import chatImageUpload from "../middleware/chatImageUpload.mjs";
import chatAudioUpload from "../middleware/chatAudioUpload.mjs";

const router = express.Router();

const staffOrExhibitor = authorizeRoles("admin", "organizer", "exhibitor");

router.post("/conversations", authMiddleware, staffOrExhibitor, createConversation);

router.get("/conversations", authMiddleware, staffOrExhibitor, getMyConversations);

router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  staffOrExhibitor,
  getConversationMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  staffOrExhibitor,
  sendTextMessage
);

router.post(
  "/conversations/:conversationId/images",
  authMiddleware,
  staffOrExhibitor,
  chatImageUpload.single("image"),
  sendImageMessage
);

router.post(
  "/conversations/:conversationId/audio",
  authMiddleware,
  staffOrExhibitor,
  chatAudioUpload.single("audio"),
  sendAudioMessage
);

router.put(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  staffOrExhibitor,
  editMessage
);

router.delete(
  "/conversations/:conversationId/messages/:messageId",
  authMiddleware,
  staffOrExhibitor,
  deleteMessage
);

export default router;
