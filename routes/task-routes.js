import { Router } from "express";
import taskCtrl from "../controllers/task-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";
import { uploadMultipleFiles } from "../middleware/multer-middleware.js";
import catchErrors from "../utils/catch-async-util.js";

const router = Router();

router.use(authMiddleWare.protect);

router.post("/", authMiddleWare.authorize("designer"), catchErrors(taskCtrl.createTask))

router.get(
  "/designer/:status",
  authMiddleWare.authorize("designer"),
  catchErrors(taskCtrl.getDesignerTasks
))

router.put(
  "/:task_id",
  authMiddleWare.authorize("designer"),
  catchErrors(taskCtrl.updateTask
))

router
  .route("/:task_id/assign/:associate_id")
  .put(authMiddleWare.authorize("designer"), catchErrors(taskCtrl.assignAssociateToTheTask))

router.getMyTaskDesinger = router.get(
  "/designer/mytask/:task_id",
  authMiddleWare.authorize("designer"),
  catchErrors(taskCtrl.getMyTaskDesinger
))

router.use(authMiddleWare.authorize("associate"));

router.get("/live", catchErrors(taskCtrl.getAllLiveTasks))

router.get("/associate/:status", catchErrors(taskCtrl.getAssociateTasks))

router.get("/associate/details/:task_id", catchErrors(taskCtrl.getTaskDettails))

router.put("/accept/:task_id", catchErrors(taskCtrl.acceptByAssociate))

router.get("/associate/mytask/:task_id", catchErrors(taskCtrl.getMyTaskAssociate))

router.delete("/:task_id/delete/:delete_id", catchErrors(taskCtrl.deleteProgressItem))

router.put(
  "/progress/:task_id",
  uploadMultipleFiles(["image/png", "image/jpeg"], 1024 * 1024 * 10, 10),
  catchErrors(taskCtrl.updateTaskProgress
))

router.put("/:task_id/complete", catchErrors(taskCtrl.completeTask))

export default router;
