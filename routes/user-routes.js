import { Router } from "express";
import userCtrl from "../controllers/user-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import { uploadAvatar } from "../middleware/multer-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

//--------------------- get me protected for login --------------------//
router.use(authMiddleWare.protect);

router.get("/me", catchErrors(userCtrl.getUser));

//-------------------------- user power ------------------------//

router.put("/update", catchErrors(userCtrl.updateMe));

router.put("/updatePassword", catchErrors(userCtrl.updatePassword));

router.put(
  "/update-profile-pic",
  uploadAvatar(["image/png", "image/jpeg"]),
  catchErrors(userCtrl.updateProfilePic)
);

//-------------------------- designer power ------------------------//
router.get(
  "/clients",
  authMiddleWare.authorize("designer"),
  catchErrors(userCtrl.getClients)
);

router.get(
  "/associates",
  authMiddleWare.authorize("designer"),
  catchErrors(userCtrl.getAssociates)
);

//-------------------------- admin power ------------------------//

router.use(authMiddleWare.authorize("admin"));

router.get("/", catchErrors(userCtrl.getUsers));
router.put("/:user_id", catchErrors(userCtrl.UserStatusController));

router.get("/designers", catchErrors(userCtrl.getDesigners));

export default router;
