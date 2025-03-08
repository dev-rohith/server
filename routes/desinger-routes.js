import { Router } from "express";

import designerProfileCtrl from "../controllers/desinger-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import { uploadMultipleFiles } from "../middleware/multer-middleware.js";
import { validateDesingerProfile } from "../validators/designer-profile-validation.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.get("/all", catchErrors(designerProfileCtrl.getAllDesingers)) //only designers basic for landing page

router.get("/portfolios", catchErrors(designerProfileCtrl.getAllPortfolios)) //only portfolios

router.get("/profile/:designer_id", catchErrors(designerProfileCtrl.getDesingerProfile))

  //--------------------- protected  --------------------//
router.use(authMiddleWare.protect);

router.use(authMiddleWare.authorize("designer"));

router
  .route("/profile")
  .post(validateDesingerProfile, catchErrors(designerProfileCtrl.createMyProfile))
  .get(catchErrors(designerProfileCtrl.getMyProfile))
  .put(validateDesingerProfile, catchErrors(designerProfileCtrl.editMyProfile))

router
  .route("/portfolio")
  .post(
    uploadMultipleFiles(["image/png", "image/jpeg"], 1024 * 1024 * 10, 10),
    catchErrors(designerProfileCtrl.addItemToPortfolio
  ))
  .get(catchErrors(designerProfileCtrl.getMyPortfolio))

router
  .route("/portfolio/:item_id")
  .delete(catchErrors(designerProfileCtrl.deleteItemFromPortfolio))
  .put(
    uploadMultipleFiles(["image/png", "image/jpeg"], 1024 * 1024 * 10, 10),
    catchErrors(designerProfileCtrl.editItemFromPortfolio
  ))

export default router;
