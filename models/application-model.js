import { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resume: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String, 
        required: true,
      },
    },
    description: String,
    introduction_video: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String, 
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedRole: {
      type: String,
      enum: ["designer", "associate"],
    },
    requestedDate: {
      type: Date,
    },
    actionMadeBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Application = model("Application", applicationSchema);

export default Application;
