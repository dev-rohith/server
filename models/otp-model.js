import { Schema, model } from "mongoose";

const otpSchema = new Schema({
    user: Schema.Types.ObjectId,
    otp: Number,
    resend_limit: {
      type: Number,
      default: 5,
    },
    otp_chances: {
      type: Number,
      default: 3,
      max: 3,
      min: 0,
    },
    otpExpiresIn: Date,
},{timestamps: true})

const Otp = model('otp', otpSchema)

export default Otp