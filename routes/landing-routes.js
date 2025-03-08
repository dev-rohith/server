import { Router } from "express";
import landingCtrl from "../controllers/landing-controller.js";
import { uploadSingleFile } from "../middleware/multer-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.get("/", catchErrors(landingCtrl.getLanding));

router.post(
  "/carousel",
  uploadSingleFile(
    ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    "carousel"
  ),
  catchErrors(landingCtrl.createCarouselItem)
);

router.delete(
  "/carousel/:public_id",
  catchErrors(landingCtrl.deleteCarouselItem)
);

router.post("/designer", catchErrors(landingCtrl.addTopDesigner));
router.delete(
  "/desinger/:desinger_id",
  catchErrors(landingCtrl.deleteTopDesigner)
);

router.post(
  "/customer-review",
  uploadSingleFile(["video/mp4"], "reviewVideo"),
  catchErrors(landingCtrl.addCustomerReview)
);

router.delete(
  "/customer-review/:public_id",
  catchErrors(landingCtrl.deleteCustomerReview)
);

export default router;
