import { UAParser } from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto, { verify } from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/user-model.js";
import { TokenManager } from "../services/redis-service.js";
import { Token } from "../services/token-service.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";
import Email from "../utils/send-email.js";
import {
  deviceIdValidator,
  forgotPasswordValidator,
  loginValidator,
  otpValidator,
  resetPasswordValidator,
  signupValidator,
  userIdValidator,
} from "../validators/auth-validation.js";
import Otp from "../models/otp-model.js";

const authController = {};

//---------------------------------------------------Normal-login-flow----------------------------------------------------//

authController.signup = async (req, res, next) => {
  const { value, error } = signupValidator.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));
  // Generate OTP
  const userAlreadyExists = await User.findOne({ email: value.email });
  if (userAlreadyExists && userAlreadyExists.isVerified)
    return next(new AppError("User already exists", 400));
  if (userAlreadyExists && !userAlreadyExists.isVerified) {
    req.params.user_id = userAlreadyExists._id;
    return next();
  }
  // Create user
  const user = await User.create({
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    password: value.password,
  });

  if (!user) {
    return next(new AppError("Error while creating user account", 500));
  }
  req.params.user_id = user._id;
  next();
}

authController.sendOtpVerfication = async (req, res, next) => {
  const { user_id } = req.params; //user_id is coming from previous middleware
  const user = await User.findById(user_id);
  if (!user) return next(new AppError("user not found", 404));

  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const newOtp = await Otp.create({
    user: `${user._id}`,
    otp: generatedOtp,
    otpExpiresIn: Date.now() + 5 * 60 * 1000,
  });
  if (!newOtp) return next(new AppError("Error while generating otp", 500));
  try {
    await new Email(user.firstName, user.email).sendOtp(newOtp.otp);

    res.status(200).json({
      verificationId: user._id,
      message: "Verify the OTP to create your account",
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id, { new: true });
    return next(
      new AppError(
        "Error while sending verification email. Please try again later.",
        500
      )
    );
  }
}

authController.verifyAccount = async (req, res, next) => {
  const { error, value } = otpValidator.validate({
    ...req.params,
    ...req.body,
  });
  if (error) return next(new AppError(error.details[0].message, 422));
  const { otp, user_id } = value;
  if (isNaN(otp)) return next(new AppError("otp must be an number", 400));
  const userOtp = await Otp.findOne({ user: `${user_id}` });
  if (!userOtp) return next(new AppError("otp not found try resend otp", 400));

  // Check OTP chances BEFORE any modifications
  if (userOtp.otp_chances <= 0) {
    return next(
      new AppError(
        "otp chances has been over, misuse of otp may cause deactivation of account",
        400
      )
    );
  }

  if (new Date(userOtp.otpExpiresIn) < new Date()) {
    return next(new AppError("Otp has been expired. try resend again.", 400));
  }

  if (Number(otp) === userOtp.otp) {
    await User.findByIdAndUpdate(userOtp.user, { isVerified: true });
    await Otp.findByIdAndDelete(userOtp._id);
    return res.status(201).json({
      message: "your account has be created successfully",
    });
  } else {
    userOtp.otp_chances = userOtp.otp_chances - 1;
    await userOtp.save();

    return res.status(400).json({
      message: `Incorrect Otp you have ${userOtp.otp_chances} chances left`,
    });
  }
}

authController.resendVerification = async (req, res, next) => {
  const { value, error } = userIdValidator.validate(req.params);
  if (error) return next(new AppError(error.details[0].message, 422));
  const userOtp = await Otp.findOne({ user: value.user_id });
  if (!userOtp)
    next(
      new AppError(
        "user not found try to signup first to send verification",
        404
      )
    );
  if (userOtp.resend_limit < 1)
    throw new AppError("Resend request limit over try again after 24h", 400);
  const user = await User.findById(userOtp.user);
  if (!user) return next(new AppError("user not found", 404));
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  userOtp.otp = generatedOtp;
  userOtp.resend_limit = userOtp.resend_limit - 1;
  userOtp.otp_chances = 3;
  userOtp.otpExpiresIn = Date.now() + 5 * 60 * 1000; // OTP expiry 5 minutes
  await userOtp.save();

  await new Email(user.firstName, user.email).sendOtp(userOtp.otp);
  res.status(200).json({
    status: "success",
    message: "A new OTP has been sent to your registered email.",
  });
}

authController.login = async (req, res, next) => {
  const { value, error } = loginValidator.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));
  const { email, password } = value;
  const cookie = req.cookies;

  const userAgent =
    req.get["User-Agent"] ||
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/537.36";
  const parser = new UAParser();
  const { device, os, browser } = parser.setUA(userAgent).getResult();

  if (cookie?.jwt) {
    jwt.verify(
      cookie.jwt,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, user) => {
        res.clearCookie("jwt");
        if (!err) {
          await TokenManager.removeRefreshToken(user._id, user.deviceId);
        }
      }
    );
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new AppError("user not found", 404));

  if (user.isVerified === false)
    return next(
      new AppError(
        "user is not verified try to verify by using signup process",
        403
      )
    );

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("invalid credentials", 403));
  }

  if (user.status === "suspended") {
    return next(new AppError("Your Account has been suspended", 403));
  }

  const deviceId = uuidv4(); //may be later changed with device ip
  const deviceName = device?.vendor || browser?.name || os?.name || "unkown";

  const accessToken = Token.generateAccessToken(
    user._id,
    user.role,
    user.status
  );

  const refreshToken = Token.generateRefreshToken(
    user._id,
    user.role,
    deviceId
  );

  res.cookie("jwt", refreshToken, { httpOnly: true });

  // Initialize arrays only if undefined (no need for separate initialization)
  if (user.devices.length >= user.maxDevices) {
    return res.status(429).json({
      message: "Device limit reached. Please log out of a device to log in.",
      data: user.devices,
    });
  }

  // Push the new device directly and manage the last login array in one step
  user.devices.push({ deviceId, deviceName });
  user.lastLoginOn.length >= 2 && user.lastLoginOn.shift(); // Remove oldest if over limit
  user.lastLoginOn.push(Date.now()); // Update the last login timestamp

  await TokenManager.storeRefreshToken(user._id, deviceId, refreshToken);

  await user.save();

  res.json({
    accessToken: accessToken,
  });
}

authController.forgotPassword = async (req, res, next) => {
  const { value, error } = forgotPasswordValidator.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));
  const { email } = value;
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await new Email(user.firstName, user.email).sendPasswordReset(resetURL);

    res.json({ message: "password Reset link sent to email successfully" });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
}

authController.resetPassword = async (req, res, next) => {
  const { value, error } = resetPasswordValidator.validate({
    ...req.params,
    ...req.body,
  });
  if (error) return next(new AppError(error.details[0].message, 422));
  const { password, token } = value;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.devices.forEach(async (device) => {
    await TokenManager.removeRefreshToken(user._id, device.deviceId);
  });

  user.devices = [];

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Your password has been reseted successfully" });
}

authController.logoutDevice = async (req, res, next) => {
  const { value, error } = deviceIdValidator.validate(req.params);
  if (error) return next(new AppError(error.details[0].message, 422));
  const { deviceId } = value;

  const refreshToken = req.cookies.jwt;
  if (!refreshToken) {
    return next(
      new AppError("unethical Access you will be logouted automatically", 403)
    );
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decodedRefresh) => {
      if (err)
        return next(
          new AppError(
            "first login with correct credentials to logout other device",
            403
          )
        );

      const user = await User.findOne({ "devices.deviceId": deviceId });
      if (!user) return next(new AppError("device is not found in db", 404));
      user.devices = user.devices.filter(
        (device) => device.deviceId !== deviceId
      );
      await TokenManager.removeRefreshToken(user._id, deviceId);

      user.save();
      // ---------         if we clear cookie here then user can only logout one device at a time
      res.status(200).json({
        message: "user device logouted successfully go back and login again",
      });
    }
  );
}

authController.logoutUser = async (req, res, next) => {
  const refreshToken = req.cookies.jwt;

  res.clearCookie("jwt");

  if (!refreshToken) {
    return next(
      new AppError(
        "Unethical access detected. Soon You will be logged out automatically .",
        403
      )
    );
  }

  const decodedRefresh = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(req.user.userId);
  if (!user) {
    return next(new AppError("User not found. Try logging in again.", 403));
  }

  user.devices = user.devices.filter(
    (device) => device.deviceId !== decodedRefresh.deviceId
  );

  await TokenManager.removeRefreshToken(user._id, decodedRefresh.deviceId);

  await user.save();

  return res.json({ message: "Logout successful" });
}

export default authController;
