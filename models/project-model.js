import { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: String,
    description: String,
    client: { type: Schema.Types.ObjectId, ref: "User" },
    designer: { type: Schema.Types.ObjectId, ref: "User" },
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
    location: { lat: Number, lng: Number },
    status: {
      type: String,
      enum: ["pending", "inprogress", "review", "completed"],
      default: "pending",
    },
    minimumDays: Number,
    completedDate: Date,
    budget: Number,
    isPaid: {
      type: Boolean,
      default: false,
    },
    completion_percentage: {
      type: Number,
      default: 0,
    },
    beforePictures: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    afterPictures: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    milestones: [String],
    review: String,
  },
  { timestamps: true }
);

const Project = model("Project", projectSchema);

export default Project;
