import ChatRoom from "../models/chatRoom-model.js";
import Message from "../models/message-model.js";
import Media from "../models/media-model.js";
import { redisClient } from "../config/redis-config.js";
import User from "../models/user-model.js";
import AppError from "../utils/app-error-util.js";
import QueryHelper from "../utils/query-helper.js";
import CloudinaryService from "../services/cloudinary-service.js";
import fs from "fs";

const chatCtrl = {};

chatCtrl.initializeChat = async (req, res, next) => {
  const { designerId } = req.body;
  const clientId = req.user.userId;

  if (req.user.userRole !== "client") {
    return next(new AppError("Only clients can initialize chats", 403));
  }

  const designer = await User.findById(designerId);
  if (!designer || designer.role !== "designer") {
    return next(new AppError("Designer not found", 404));
  }

  const existingChat = await ChatRoom.findOne({
    client: clientId,
    designer: designerId,
  }).populate("designer", "firstName lastName profilePicture");

  if (existingChat) {
    return res.json(existingChat);
  }

  const chatRoom = await ChatRoom.create({
    client: clientId,
    designer: designerId,
    isFreeTrial: req.user.subscription.plan === "free",
  });

  const populatedChatRoom = await ChatRoom.findById(chatRoom._id).populate(
    "designer",
    "firstName lastName profilePicture"
  );

  res.status(201).json(populatedChatRoom);
};

chatCtrl.sendMessage = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { content } = req.body;
    const senderId = req.user.userId;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return next(new AppError("Chat room not found", 404));
    }

    if (
      chatRoom.client.toString() !== senderId.toString() &&
      chatRoom.designer.toString() !== senderId.toString()
    ) {
      return next(new AppError("You are not part of this chat", 403));
    }

    // if client has free chats remaining
    if (
      req.user.userRole === "client" &&
      req.user.subscription.plan === "free" &&
      chatRoom.isFreeTrial
    ) {
      if (req.user.freeChatRemaining <= 0) {
        return next(new AppError("You have used all free messages", 403));
      }

      // Decrementing free chats
      await User.findByIdAndUpdate(senderId, {
        $inc: { freeChatRemaining: -1 },
      });

      // redisClient cache
      const cachedSubscription = await redisClient.get(
        `subscription:${senderId}`
      );
      if (cachedSubscription) {
        const subscription = JSON.parse(cachedSubscription);
        subscription.freeChatRemaining -= 1;
        await redisClient.set(
          `subscription:${senderId}`,
          JSON.stringify(subscription),
          "EX",
          600
        );
      }
    }

    let message;

    if (req.file) {
      const result = await CloudinaryService.uploadFile(req.file);

      const media = await Media.create({
        url: result.secure_url,
        publicId: result.public_id,
        fileType: req.file.mimetype,
        fileName: req.file.originalname,
        size: req.file.size,
        uploadedBy: senderId,
        chatRoom: chatRoomId,
      });

      message = await Message.create({
        chatRoom: chatRoomId,
        sender: senderId,
        messageType: req.file.mimetype.startsWith("image/") ? "image" : "file",
        content: content || "",
        media: {
          url: media.url,
          publicId: media.publicId,
          fileType: media.fileType,
          fileName: media.fileName,
        },
      });
    } else {
      message = await Message.create({
        chatRoom: chatRoomId,
        sender: senderId,
        messageType: "text",
        content,
      });
    }

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessage: message._id,
      $inc: { messageCount: 1 },
    });

    try {
      await fs.promises.unlink(req.file.path);
    } catch (error) {
      console.error("Error while deleting the file:", error.message);
    }

    req.app
      .get("io")
      .to(chatRoomId)
      .emit("new_message", {
        message: await Message.findById(message._id).populate(
          "sender",
          "firstName lastName profilePicture role"
        ),
      });

    res.status(204).send();
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

chatCtrl.getMessages = async (req, res) => {
  const { chatRoomId } = req.params;
  const userId = req.user.userId;
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return res.status(404).json({ error: "Chat room not found" });
  }

  if (
    chatRoom.client.toString() !== userId.toString() &&
    chatRoom.designer.toString() !== userId.toString()
  ) {
    return res.status(403).json({ error: "You are not part of this chat" });
  }

  const features = new QueryHelper(
    Message.find({ chatRoom: chatRoomId }),
    req.query
  )
    .filterAndSearch()
    .sort("-createdAt")
    .paginate(20);

  const finalQuery = features.query
    .populate("sender", "firstName lastName profilePicture role")
    .lean();

  await Message.updateMany(
    {
      chatRoom: chatRoomId,
      sender: { $ne: userId },
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  const messages = await finalQuery;
  const total = await Message.countDocuments({
    chatRoom: chatRoomId,
  });
  const perPage = parseInt(req.query.limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, totalPages, data: messages });
};

chatCtrl.getChatRooms = async (req, res) => {
  const userId = req.user.userId;
  const { userRole } = req.user;

  const query =
    userRole === "client" ? { client: userId } : { designer: userId };

  const finalQuery = ChatRoom.find(query)
    .sort({ updatedAt: -1 })
    .populate("lastMessage");

  if (userRole === "client") {
    finalQuery.populate({
      path: "designer",
      select: "firstName lastName profilePicture role isOnline lastActive",
    });
  } else {
    finalQuery.populate({
      path: "client",
      select: "firstName lastName profilePicture role isOnline lastActive",
    });
  }

  const chatRooms = await finalQuery;

  res.json(chatRooms);
};

export default chatCtrl;
