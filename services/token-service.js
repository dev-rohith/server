import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE;
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE;

export const Token = {
  generateAccessToken(userId, userRole, userStatus) {
    return jwt.sign(
      { userId, userRole, userStatus },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRE * 60,
      }
    );
  },
  generateRefreshToken(userId, userRole, deviceId) {
    return jwt.sign(
      { userId, userRole, deviceId },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRE * 24 * 60 * 60,
      }
    );
  },
};
