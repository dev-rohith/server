import { Schema, model } from "mongoose";

const mediaSchema = new Schema({
  url: {
  type: String,
  required: true
  },
  publicId: {
  type: String,
  required: true
  },
  fileType: String,
  fileName: String,
  size: Number,
  uploadedBy: {
  type: Schema.Types.ObjectId,
  ref: 'User'
  },
  chatRoom: {
  type: Schema.Types.ObjectId,
  ref: 'ChatRoom'
  }
  }, { timestamps: true });

const Media = model("Media", mediaSchema);

export default Media;
