import User from "../models/user-model.js";
import CloudinaryService from "../services/cloudinary-service.js";
import { TokenManager } from "../services/redis-service.js";
import QueryHelper from "../utils/query-helper.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";
import fs from "fs";
import {
  userPasswordValidator,
  userStatusChangeValidator,
} from "../validators/user-validation.js";

const userCtrl = {};

userCtrl.getUser = async (req, res, next) => {
  let filterSting =
    "email lastLoginOn status role profilePicture lastName firstName";
  if (req.user.userRole === "client") filterSting += " subscription";
  const user = await User.findOne({ _id: req.user?.userId })
    .select(filterSting)
    .lean();
  res.json(user);
}


userCtrl.updatePassword = async (req, res, next) => {
  const { value, error } = userPasswordValidator.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 422));
  
  const { currentPassword, newPassword } = value;

  const user = await User.findOne({ _id: req.user?.userId }).select(
    "+password"
  );
  if (!user || !(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Incorrect password", 401));
  }

  user.password = newPassword;

  user.devices.forEach(async (device) => {
    await TokenManager.removeRefreshToken(user._id, device.deviceId);
  });

  await user.save();

  res.json({ message: "Password updated successfully" });
}

userCtrl.updateProfilePic = async (req, res, next) => {
  if (!req.file) return next(new AppError("image must needed to update", 400));
  const upload = await CloudinaryService.uploadFile(req.file);
  const profilePicture = upload.secure_url;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { profilePicture },
    { new: true }
  ).lean();
  try {
    fs.promises.unlink(req.file?.path);
  } catch (unlinkError) {
    console.error("Error while deleting the file:", unlinkError.message);
  }
  res.json({
    message: "your profile picture has been updated successfully",
    new_pic: user.profilePicture,
  });
}

userCtrl.updateMe = async (req, res, next) => {
  const { firstName, lastName } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { firstName, lastName },
    { new: true }
  ).lean();
  res.json({
    message: "name has been changed successfully",
    data: { firstName, lastName },
  });
}

userCtrl.getUsers = async (req, res, next) => {
  const features = new QueryHelper(User, req.query)
    .filterAndSearch()
    .sort()
    .paginate();
  const finalQuery = features.query
    .select("status role profilePicture lastName firstName email lastLoginOn")
    .lean();

  const users = await finalQuery;
  const total = await User.countDocuments();
  const perPage = parseInt(req.query.limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: users });
}

userCtrl.getClients = async (req, res, next) => {
  const features = new QueryHelper(User.find({ role: "client" }), req.query)
    .filterAndSearch("firstName")
    .paginate();
  const finalQuery = features.query
    .select("profilePicture lastName firstName status")
    .lean();
  const users = await finalQuery;
  res.json(users);
}

userCtrl.getDesigners = async (req, res, next) => {
  const features = new QueryHelper(User.find({ role: "designer" }), req.query)
    .filterAndSearch("firstName")
    .paginate();
  const finalQuery = features.query
    .select("profilePicture lastName firstName status")
    .lean();
  const desinger = await finalQuery;
  res.json(desinger);
}

userCtrl.getAssociates = async (req, res, next) => {
  const features = new QueryHelper(User.find({ role: "associate" }), req.query)
    .filterAndSearch("firstName")
    .paginate();
  const finalQuery = features.query
    .select("profilePicture lastName firstName status")
    .lean();
  const desinger = await finalQuery;
  res.json(desinger);
}

userCtrl.UserStatusController = async (req, res, next) => {
  const { value, error } = userStatusChangeValidator.validate({
    ...req.body,
    ...req.params,
  });
  if (error) return next(new AppError(error.details[0].message, 422));
  const { user_id, status } = value;
  const deactivatedUser = await User.findByIdAndUpdate(
    user_id,
    { status },
    {
      new: true,
      runValidators: true,
    }
  ).select(
    "-lastActive -maxDevices -subscription -devices -otp_chances -languages_known -__v"
  );
  if (!deactivatedUser) throw next(new AppError("user not found", 404));
  res.status(200).json({
    message: "user account status changed successfully",
    user: deactivatedUser,
  });
}

userCtrl.logoutAllUsers = async (req, res, next) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (!user) return next(new AppError("user is not found in db", 404));
  const tokenClearPromises = user.devices.map((device) => {
    TokenManager.removeRefreshToken(userId, device.deviceId);
  });
  await Promise.allSettled(tokenClearPromises);
  user.devices = [];
  user.save();
  res.json({ message: "successfully logouted from all the devices" });
}

export default userCtrl;
