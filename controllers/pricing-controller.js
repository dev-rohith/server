import Pricing from "../models/pricing-modal.js";
import AppError from "../utils/app-error-util.js";

const pricingCtrl = {};

pricingCtrl.getSubscriptions = async (req, res, next) => {
  const subscription = await Pricing.findOne({}).lean();
  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }
  res.json({ subscription });
};

pricingCtrl.createSubscriptionPricing = async (req, res, next) => {
  const {
    monthly_price,
    discounted_monthly_price,
    yearly_price,
    discounted_yearly_price,
  } = req.body;

  const alreadyExist = await Pricing.findOne({});
  if (alreadyExist)
    return next(new AppError("SubscriptionPricing already exist. You only first time can create pricing. But you can update it at anytime", 400));

  const subscription = await Pricing.create({
    monthly_price,
    discounted_monthly_price,
    yearly_price,
    discounted_yearly_price,
  });
  res.json({ subscription });
};

pricingCtrl.updateSubscriptionPricing = async (req, res, next) => {
  const {
    monthly_price,
    discounted_monthly_price,
    yearly_price,
    discounted_yearly_price,
  } = req.body;
  const subscription = await Pricing.findOneAndUpdate(
    {},
    {
      monthly_price,
      discounted_monthly_price,
      yearly_price,
      discounted_yearly_price,
    },
    { new: true }
  );
  res.json({ subscription });
};

export default pricingCtrl;
