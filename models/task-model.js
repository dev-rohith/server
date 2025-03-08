import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    associate: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    designer: {
      type: Schema.Types.ObjectId,
      ref: "User", 
    },
    status: {
      type: String,
      enum: ["pending", "inprogress", "completed"],
      default: "pending",
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
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"] },
    startDate: Date,
    dueDate: Date,
    isVisibleToClient: Boolean,

    workUpdates: [
      {
        updateLocation: Object,
        description: String,
        images: [
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
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Task = model("Task", taskSchema);

export default Task;
