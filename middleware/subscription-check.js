import { redisClient } from "../config/redis-config.js";
import User from "../models/user-model.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";

const checkSubscription = catchErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const cachedSubscription = await redisClient.get(`subscription:${userId}`);
  if (cachedSubscription) {
    const subscription = JSON.parse(cachedSubscription);
    req.user.subscription = subscription;

    if (subscription.plan === "free" && subscription.freeChatRemaining <= 0) {
      return next(new AppError("Your free chat limit has been reached. take a subscription to continue!",403));
    }

    if (subscription.plan !== "free" && !subscription.active) {
      return next(new AppError("Your subscription has been expired!, buy again and continue!",403));
    }

    return next();
  }

    const user = await User.findById(userId).select("subscription freeChatRemaining");

    if (!user) {
       return next(new AppError("User not found", 404));
    }

    if (user.subscription.plan !== "free" && !user.subscription.active) {
       return next(new AppError("Your subscription has been expired!, buy a subscription plan and continue!",403));
    }

    if (user.subscription.plan === "free" && user.freeChatRemaining <= 0) {
      return next(new AppError("You have used all free messages please upgrade to a subscription plan",403));
    }

    await redisClient.set(
      `subscription:${userId}`,
       JSON.stringify({
        plan: user.subscription.plan,
        active: user.subscription.active,
        freeChatRemaining: user.freeChatRemaining,
      }),
      "EX",
       600
      );

     req.user.subscription = {
      plan: user.subscription.plan,
      active: user.subscription.active,
      freeChatRemaining: user.freeChatRemaining,
      };

     return next();
});

export default checkSubscription;
