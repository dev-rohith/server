import { Router } from "express";
import projectCtrl from "../controllers/project-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import { uploadSingleFile } from "../middleware/multer-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.use(authMiddleWare.protect);


router.get(
  "/:project_id",
  authMiddleWare.authorize("client", "designer"),
  catchErrors(projectCtrl.getProject
))

router.put(
  "/accept/:project_id",
  authMiddleWare.authorize("client"),   //payment here ---------------------------------
  catchErrors(projectCtrl.acceptProject
))

router.put(
  "/review/:project_id",
  authMiddleWare.authorize("client"),
  catchErrors(projectCtrl.clientRating
))

router.get(
  "/client/:status",
  authMiddleWare.authorize("client"),
  catchErrors(projectCtrl.getMyProjectsClient
))

router.use(authMiddleWare.authorize("designer"))

router.post("/", catchErrors(projectCtrl.createProject))
router.get("/designer/:status", catchErrors(projectCtrl.getMyProjectsDesigner))

router
  .route("/:project_id")
  .put(catchErrors(projectCtrl.editProject))
  .delete(catchErrors(projectCtrl.deleteProject))

router.put("/:project_id/sent-review", catchErrors(projectCtrl.sentProjectToReview))

router.put("/progress/:project_id", catchErrors(projectCtrl.updateProjectProgress))

router.put(
  "/before/:project_id",
  uploadSingleFile(["image/png", "image/jpeg"], "image", 1024 * 1024 * 10),
  catchErrors(projectCtrl.addBeforeProjectToPortfolio
))

router.delete(
  "/before/:project_id/item/:Item_id",
  catchErrors(projectCtrl.deleteBeforeProjectToPortifolio
))

router.put(
  "/after/:project_id",
  uploadSingleFile(["image/png", "image/jpeg"], "image", 1024 * 1024 * 10),
  catchErrors(projectCtrl.addAfterProjectToPortfolio
))

router.delete(
  "/after/:project_id/item/:Item_id",
  catchErrors(projectCtrl.deleteAfterProjectToPortifolio
))

router.put("/:project_id/complete", catchErrors(projectCtrl.complete))

export default router;
