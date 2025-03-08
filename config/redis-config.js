import chalk from "chalk";
import { createClient } from "redis";

export const redisClient = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-10104.crce179.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 10104,
  },
});

const connectRedis = async () => {
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  try {
    await redisClient.connect();
    console.log(chalk.magenta("Redis is connected"));
  } catch (error) {
    console.log(`Error while connecting Redis: ${error.messge}`);
  }
};

export default connectRedis;
