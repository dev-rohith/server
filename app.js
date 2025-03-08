import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit'
import helmet from "helmet";

import fs from "fs";

import authRouter from "./routes/auth-routes.js";
import userRouter from "./routes/user-routes.js";
import applicationRouter from "./routes/application-routes.js";
import taskRouter from "./routes/task-routes.js";
import landingRouter from "./routes/landing-routes.js";
import desingerRouter from "./routes/desinger-routes.js";
import projectRouter from "./routes/project-routes.js";
import associateRouter from "./routes/associate-routes.js";
import paymentRouter from "./routes/payment-routes.js";
import chatRouter from "./routes/chatRoutes.js";
import analyticsRouter from './routes/analytics-routes.js'

import globalErrorHandler from "./controllers/error-controller.js";

const app = express();

app.use(helmet());

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 100, 
	standardHeaders: 'draft-8', 
  message: 'Too many requests from this IP, please try again after an hour',
	legacyHeaders: false, 
})

app.use(limiter)

const logStream = fs.createWriteStream("./access.log", { flags: "a" });
app.use(morgan("dev", { stream: logStream }));

//routing api middleware

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/landing", landingRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/designer", desingerRouter);
app.use("/api/v1/associate", associateRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/chat", chatRouter);
app.use('/api/v1/analytics', analyticsRouter)

app.use(globalErrorHandler);

export default app;
