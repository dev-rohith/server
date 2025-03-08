import { Schema,model } from "mongoose";


const messageSchema = new Schema({
  chatRoom: {
  type: Schema.Types.ObjectId,
  ref: 'ChatRoom',
  required: true
  },
  sender: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true
  },
  messageType: {
  type: String,
  enum: ['text', 'image', 'file'],
  default: 'text'
  },
  content: String,
  media: {
  url: String,
  publicId: String,
  fileType: String,
  fileName: String
  },
  read: {
  type: Boolean,
  default: false
  },
  readAt: Date
  }, { timestamps: true });


const Message = model("Message", messageSchema); 
   
export default Message;