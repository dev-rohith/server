import { Router } from "express";
import checkSubscription from "../middleware/subscription-check.js";
import chatCtrl from "../controllers/chat-controller.js";
import { uploadSingleFile } from "../middleware/multer-middleware.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.use(authMiddleWare.protect);

router.post("/rooms", checkSubscription, catchErrors(chatCtrl.initializeChat));

router.post(
  "/rooms/:chatRoomId/messages",
  checkSubscription,
  uploadSingleFile(
    ["image/png", "image/jpeg", "audio/mp3", "audio/mpeg", "video/mp4"],
    "file",
    1024 * 1024 * 20
  ),
  catchErrors(chatCtrl.sendMessage)
);

router.get("/rooms/:chatRoomId/messages", catchErrors(chatCtrl.getMessages));

router.get("/rooms", catchErrors(chatCtrl.getChatRooms));

export default router;
