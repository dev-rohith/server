import { Router } from "express";
import analyticsCtrl from "../controllers/analytics-controller.js";
import authMiddleWare from "../middleware/auth-middleware.js";

const router = Router()

router.use(authMiddleWare.protect)

router.get('/admin', authMiddleWare.authorize('admin'), analyticsCtrl.getAdminAnalytics)



export default router