import { Schema, model } from "mongoose";

const associateProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      house_number: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postal_code: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    recent_completed_tasks: {
      type: Schema.Types.ObjectId,
      unique: true,
    },
    completedTasksCount: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },

    availability: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

associateProfileSchema.index({ location: "2dsphere" });

const AssociateProfile = model("AssociateProfile", associateProfileSchema);

export default AssociateProfile;
