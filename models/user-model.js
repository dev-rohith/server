import { model, Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

const userSchema = new Schema(
  {
    googleId: String,
    email: String,
    password: { type: String, select: false },
    firstName: String,
    lastName: String,
    profilePicture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "designer", "associate", "client"],
      default: "client",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    lastLoginOn: [Date],

    devices: [
      {
        deviceId: String,
        deviceName: String,
      },
    ],
    maxDevices: { type: Number, default: 3 },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "monthly", "yearly"],
        default: "free",
      },
      active: { type: Boolean, default: false },
      expiryDate: Date,
      lastPaymentDate: Date,
    },
    freeChatRemaining: {
      type: Number,
      default: 20,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: { type: Date, default: Date.now },

    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcryptjs.genSalt();
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcryptjs.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = model("User", userSchema);

export default User;
