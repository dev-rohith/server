import { Router } from "express";
import associateProfileCtrl from "../controllers/associate-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.use(authMiddleWare.protect);

router.get(
  "/all",
  authMiddleWare.authorize("designer"),
  catchErrors(associateProfileCtrl.getAssociates)
);
router.post(
  "/nearest",
  authMiddleWare.authorize("designer"),
  catchErrors(associateProfileCtrl.getNearestAssociates)
);

router.use(authMiddleWare.authorize("associate"));

router
  .route("/profile")
  .post(catchErrors(associateProfileCtrl.createProfile))
  .put(catchErrors(associateProfileCtrl.updateProfile))
  .get(catchErrors(associateProfileCtrl.getMyProfile));

export default router;
