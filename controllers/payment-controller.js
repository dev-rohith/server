import razorpayInstance from "../config/razorpay-config.js";
import Pricing from "../models/pricing-modal.js";
import User from "../models/user-model.js";
import AppError from "../utils/app-error-util.js";
import crypto from "crypto";

const paymentCrl = {};

paymentCrl.createPaymentOrder = async (req, res, next) => {
  const { plan } = req.body;

  const user = await User.findById(req.user.userId).select("subscription");
  if (user.subscription.active) {
    return next(
      new AppError(
        "You have already subscribed to a plan wait until it expires",
        400
      )
    );
  }

  const subcription = await Pricing.findOne({}).lean();
  let amount;
  if (plan === "Monthly") {
    amount = subcription.discounted_monthly_price * 100;
  } else if (plan === "Yearly") {
    amount = subcription.discounted_yearly_price * 100;
  }

  const options = {
    amount,
    currency: "INR",
    receipt: "receipt_order_1",
  };

  razorpayInstance.orders.create(options, (err, order) => {
    if (err) {
      console.log(err);
      return next(new AppError("Something went wrong", 500));
    }
    res.status(200).json({ order, key: process.env.RAZORPAY_KEY_ID });
  });
};

paymentCrl.verifyPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    plan,
    userId,
  } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    const user = await User.findById(userId);
    user.subscription.active = true;
    if (plan === "Monthly") {
      user.subscription.plan = "monthly";
      user.subscription.active = true;
      user.subscription.lastPaymentDate = Date.now();
      user.subscription.expiryDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    } else if (plan === "Yearly") {
      user.subscription.plan = "yearly";
      user.subscription.active = true;
      user.subscription.lastPaymentDate = Date.now();
      user.subscription.expiryDate = Date.now() + 365 * 24 * 60 * 60 * 1000;
    }
    await user.save();

    return res.status(200).json({
      message: "Payment verified",
      data: {
        plan: user.subscription.plan,
        lastPaymentDate: user.subscription.lastPaymentDate,
        active: user.subscription.active,
        expiryDate: user.subscription.expiryDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
    });
  } else {
    return res.status(400).json({
      message: "Payment not verified",
    });
  }
};

export default paymentCrl;
