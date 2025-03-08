import { Server } from "socket.io";
import chalk from "chalk";
import "dotenv/config";
import app from "./app.js";

import connectDB from "./config/db-config.js";
import connectRedis from "./config/redis-config.js";
import initSocket from "./sockets/initSocket.js";

// database connection
connectDB();

// redis connection
connectRedis();

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(chalk.yellow(`Server is running on port: ${port}`));
});

const io = new Server(server, {
  cors: {
    origin: "https://designspace.live",
    methods: ["GET", "POST"],
  },
});

initSocket(io);

app.set("io", io);
