import { Router } from "express";

import authController from "../controllers/auth-controller.js";
import userCtrl from "../controllers/user-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

//token rotation
router.get("/refreshToken", authMiddleWare.refreshToken_rotation);

//auth router
router.post("/signup", catchErrors(authController.signup), catchErrors(authController.sendOtpVerfication))

router.post("/verify/:user_id", catchErrors(authController.verifyAccount))
router.post("/resend-verify/:user_id", catchErrors(authController.resendVerification))

router.post("/login", catchErrors(authController.login))

router.post("/forgetPassword", catchErrors(authController.forgotPassword))
router.put("/resetPassword/:token", catchErrors(authController.resetPassword))



  //--------------------- Logout Routes ---------------------//
router.post("/logout/:deviceId", catchErrors(authController.logoutDevice))

router.use(authMiddleWare.protect)

router.post("/logout", catchErrors(authController.logoutUser))

router.post("/logoutall", catchErrors(userCtrl.logoutAllUsers))



export default router;
