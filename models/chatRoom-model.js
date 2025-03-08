import { Schema, model } from "mongoose";

const chatRoomSchema = new Schema({
    client: { type: Schema.Types.ObjectId, ref: "User" },
    designer: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    status:{
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    messageCount: {
        type: Number,
        default: 0
    },
    isFreeTrial: {
        type: Boolean,
        default: true
    },
   
},{timestamps: true})

const ChatRoom = model("ChatRoom", chatRoomSchema);


export default ChatRoom