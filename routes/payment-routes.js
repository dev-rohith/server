import { Router } from "express";
import paymentCrl from "../controllers/payment-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import catchErrors from "../utils/catch-async-util.js";
import pricingCtrl from "../controllers/pricing-controller.js";

const router = Router();
//--------------------- public  --------------------//
router.get("/subcription-pricing", catchErrors(pricingCtrl.getSubscriptions));

//--------------------- protected  --------------------//
router.use(authMiddleWare.protect);

router.post("/subcription", catchErrors(paymentCrl.createPaymentOrder));

router.post("/verify/subcription", paymentCrl.verifyPayment); //inside error handling

//--------------------- admin power --------------------//
router.use(authMiddleWare.authorize("admin"));

router.post(
  "/subcription-pricing",
  catchErrors(pricingCtrl.createSubscriptionPricing)
);

router.put(
  "/subcription-pricing",
  catchErrors(pricingCtrl.updateSubscriptionPricing)
);

export default router;
