import { Router } from "express";

import applicationCtrl from "../controllers/application-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";

import { uploadMultipleFiles } from "../middleware/multer-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.use(authMiddleWare.protect);

router.post("/", authMiddleWare.authorize("client"),uploadMultipleFiles(["application/pdf", "video/mp4"], 1024 * 1024 * 1024 * 20, 2),
  catchErrors(applicationCtrl.createApplication)
);

router.use(authMiddleWare.authorize("admin"));

router.get("/pending", catchErrors(applicationCtrl.getPendingApplications));
router.get("/manage", catchErrors(applicationCtrl.getAllApplications));

router
  .route("/:id")
  .get(catchErrors(applicationCtrl.getApplicationDetails))
  .put(catchErrors(applicationCtrl.updateApplication))
  .delete(catchErrors(applicationCtrl.deleteApplication));

export default router;
