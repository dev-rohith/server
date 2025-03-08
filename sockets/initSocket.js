import ChatRoom from "../models/chatRoom-model.js";
import User from "../models/user-model.js";


const initSocket = (io) => {
  io.on("connection", (socket) => {
    const { userId } = socket.handshake.auth;
    if (!userId) {
      console.log("No userId provided, disconnecting socket.");
      socket.disconnect();
      return;
    }
    socket.userId = userId;

    socket.on("join_room", async (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    socket.on("update_status", async (status) => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: status });
        const user = await User.findById(socket.userId);
        const query =
          user.role === "client"
            ? { client: socket.userId }
            : { designer: socket.userId };

        const chatRooms = await ChatRoom.find(query).select("_id");
        chatRooms.forEach((room) => {
          io.to(room._id.toString()).emit("user_status", {
            userId: socket.userId,
            status,
          });
        });
      }
    });

   

    socket.on("typing", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("typing", {
        userId: socket.userId,
        typing: true,
      });
    });

    socket.on("stop_typing", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("typing", {
        userId: socket.userId,
        typing: false,
      });
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        const user = await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: false,
            lastActive: new Date(),
          },
          { new: true }
        );

        const query =
          user.role === "client"
            ? { client: socket.userId }
            : { designer: socket.userId };

        const chatRooms = await ChatRoom.find(query).select("_id");

        chatRooms.forEach((room) => {
          io.to(room._id.toString()).emit("user_status", {
            userId: socket.userId,
            status: user.isOnline,
            lastActive: user.lastActive,
          });
        });
      }
    });
  });
};

export default initSocket;
