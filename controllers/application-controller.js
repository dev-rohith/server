import fs from "fs";

import Application from "../models/application-model.js";
import User from "../models/user-model.js";
import CloudinaryService from "../services/cloudinary-service.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";
import QueryHelper from "../utils/query-helper.js";

import {
  applicationIdValidator,
  applicationValidator,
  updateApplicationValidator,
} from "../validators/application-validation.js";

const applicationCtrl = {};

applicationCtrl.createApplication = async (req, res, next) => {
  console.log("hey there");
  const isExists = await Application.findOne({
    requestedBy: req.user.userId,
  });
  if (isExists) {
    return next(
      new AppError(
        "You have already submitted an application.Only one role you can apply at a time.",
        400
      )
    );
  }
  const { value, error } = applicationValidator.validate(req.body);
  if (error) return next(new AppError(error.message, 422));
  const { description, requestedRole } = value;

  if (!req.files) return next(new AppError("Files are required", 400));

  const fileUploadPromises = req.files.map((file) => {
    return CloudinaryService.uploadFile(
      file,
      file.mimetype === "application/pdf" && "raw"
    );
  });
  try {
    const uploadResults = await Promise.all(fileUploadPromises);

    const introduction_video = {};
    const resume = {};

    uploadResults.forEach((upload) => {
      if (upload.resource_type === "video") {
        introduction_video.url = upload.secure_url;
        introduction_video.public_id = upload.public_id;
      } else if (upload.resource_type === "raw") {
        resume.url = upload.secure_url;
        resume.public_id = upload.public_id;
      }
    });

    if (
      Object.keys(introduction_video).length === 0 ||
      Object.keys(resume).length === 0
    ) {
      return next(new AppError("error while uploading to cloudinary"));
    }
    await Application.create({
      requestedBy: req.user.userId,
      resume,
      introduction_video,
      description,
      requestedRole,
      requestedDate: Date.now(),
    });

    try {
      await Promise.all(req.files.map((file) => fs.promises.unlink(file.path)));
    } catch (unlinkError) {
      console.error("Error while deleting the file:", unlinkError.message);
    }
  } catch (error) {
    try {
      await Promise.all(req.files.map((file) => fs.promises.unlink(file.path)));
    } catch (unlinkError) {
      console.error("Error while deleting the file:", unlinkError.message);
    }
    return res.json({ message: error.message, error: error });
  }
  res.json({ message: "Application sent successfully" });
};

applicationCtrl.getPendingApplications = async (req, res, next) => {
  const features = new QueryHelper(
    Application.find({ status: "pending" }),
    req.query
  )
    .filterAndSearch()
    .sort()
    .paginate();
  const finalQuery = features.query
    .populate("requestedBy", "firstName lastName profilePicture status")
    .select("requestedBy status requestedRole requestedDate")
    .lean();

  const applications = await finalQuery;

  const total = await Application.countDocuments({ status: "pending" });
  const perPage = parseInt(req.query.limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: applications });
}

applicationCtrl.getAllApplications = async (req, res, next) => {
  const features = new QueryHelper(
    Application.find({ $or: [{ status: "approved" }, { status: "rejected" }] }),
    req.query
  )
    .filterAndSearch()
    .sort()
    .paginate();

  const finalQuery = features.query
    .populate("requestedBy", "firstName lastName profilePicture status")
    .select("-resume -description -introduction_video -__v")
    .populate("actionMadeBy", "profilePicture firstName lastName")
    .lean();

  const applications = await finalQuery;
  const total = await Application.countDocuments({
    $or: [{ status: "approved" }, { status: "rejected" }],
  });
  const perPage = parseInt(req.query.limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;
  res.json({ page, perPage, totalPages, total, data: applications });
}

applicationCtrl.updateApplication = async (req, res, next) => {
  const { value, error } = updateApplicationValidator.validate({
    ...req.body,
    ...req.params,
  });
  if (error) return next(new AppError(error.message, 422));
  const { id, status } = value;

  const application = await Application.findById(id);
  if (!application) return next(new AppError("Application not found", 404));

  application.status = status;

  const requesetedUser = await User.findById(application.requestedBy);

  if (status === "approved") {
    application.actionMadeBy = req.user.userId;
    application.isApproved = true;
    requesetedUser.role = application.requestedRole;
  } else if (status === "rejected") {
    application.actionMadeBy = req.user.userId;
  }

  await requesetedUser.save();

  await application.save();

  res.json({ message: "Application updated successfully", application });
}

applicationCtrl.deleteApplication = async (req, res, next) => {
  const { value, error } = applicationIdValidator.validate(req.params);
  if (error) return next(new AppError(error.message, 422));
  const { id } = value;

  const deletedApplication = await Application.findByIdAndDelete(id)
    .select("_id")
    .lean();

  try {
    if (
      deletedApplication.resume.public_id &&
      deletedApplication.introduction_video.public_id
    ) {
      await Promise.allSettled([
        CloudinaryService.deleteFile(
          deletedApplication.introduction_video.public_id,
          "video"
        ),
        CloudinaryService.deleteFile(
          deletedApplication.resume.public_id,
          "raw"
        ),
      ]);
    } else {
      console.log("No valid public IDs found to delete.");
    }
  } catch (error) {
    console.log("Error deleting files from Cloudinary:", error.message);
  }

  res.json({
    message: "application deleted successfully",
    application: deletedApplication,
  });
}

applicationCtrl.getApplicationDetails = async (req, res, next) => {
  const { value, error } = applicationIdValidator.validate(req.params);
  if (error) return next(new AppError(error.message, 422));
  const { id } = value;

  const application = await Application.findById(id)
    .select("-actionMadeBy")
    .populate("requestedBy", "firstName lastName profilePicture status")
    .lean();
  if (!application) return next(new AppError("application not found", 404));
  res.status(200).json({ data: application });
}

export default applicationCtrl;
