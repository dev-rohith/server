import axios from "axios";
import Task from "../models/task-model.js";
import User from "../models/user-model.js";
import CloudinaryService from "../services/cloudinary-service.js";
import { getCoordinates } from "../services/georeverse-coding.js";
import { getIpInfo } from "../services/getIpInfo-service.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";
import QueryHelper from "../utils/query-helper.js";

const taskCtrl = {};

taskCtrl.createTask = async (req, res, next) => {
  const {
    name,
    description,
    priority,
    startDate,
    dueDate,
    isVisibleToClient,
    address,
  } = req.body;

  const taskData = {
    name,
    description,
    priority,
    designer: req.user.userId,
    startDate: new Date(startDate),
    dueDate: new Date(dueDate),
    isVisibleToClient,
    address,
  };

  const { lat, lng } = await getCoordinates(address);

  if (!lat || !lng)
    return next(new AppError("please provide valid address", 400));
  taskData.location = { coordinates: [lat, lng] };

  const task = await Task.create(taskData);
  if (!task) return next(new AppError("Error while creating the task", 400));

  res.json({ message: "Task created successfully" });
}

taskCtrl.updateTask = async (req, res, next) => {
  const { task_id } = req.params;

  const {
    name,
    description,
    priority,
    startDate,
    dueDate,
    isVisibleToClient,
    address,
  } = req.body;

  const taskData = {
    name,
    description,
    priority,
    startDate,
    dueDate,
    isVisibleToClient,
    address,
  };

  const hey = await Task.findOne({ _id: task_id, status: "pending" });

  const { lat, lng } = await getCoordinates(address);

  if (!lat || !lng)
    return next(new AppError("please provide valid address", 400));
  taskData.location = { coordinates: [lat, lng] };

  const task = await Task.findOneAndUpdate(
    { _id: task_id, status: "pending" },
    taskData,
    {
      new: true,
    }
  );

  if (!task)
    return next(
      new AppError(
        "Error while updating the task or task is not in pending stage anymore",
        400
      )
    );

  res.json({
    message: "Task updated successfully",
    data: task,
  });
}

taskCtrl.getDesignerTasks = async (req, res, next) => {
  const { status } = req.params;
  const features = new QueryHelper(
    Task.find({
      designer: req.user.userId,
      status,
    }),
    req.query
  )
    .filterAndSearch("title")
    .paginate(6)
    .sort();

  const finalQuery = features.query
    .select("-address -isVisibleToClient -location -designer -workUpdates")
    .populate("associate", "firstName lastName profilePicture status")
    .lean();

  const myPendingTasks = await finalQuery;

  const total = await Task.countDocuments({ status });
  const perPage = parseInt(req.query.limit) || 6;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: myPendingTasks });
}

taskCtrl.getMyTaskDesinger = async (req, res, next) => {
  const { task_id } = req.params;
  const task = await Task.findOne({
    _id: task_id,
    designer: req.user.userId,
  }).lean();
  if (!task) return next(new AppError("task was not found", 400));
  res.json(task);
}

taskCtrl.assignAssociateToTheTask = async (req, res, next) => {
  const { task_id, associate_id } = req.params;
  const associate = await User.findOne({
    _id: associate_id,
    role: "associate",
  }).lean();
  if (!associate)
    return next(
      new AppError("associate is not found or not an associate", 404)
    );

  const updatedTask = await Task.findByIdAndUpdate(
    task_id,
    { associate: associate_id, status: "inprogress" },
    { new: true }
  )
    .select("-designer")
    .populate("associate", "firstName lastName profilePicture");
  if (!updatedTask)
    return next(new AppError("Error while updating the task", 400));
  // mail need to send to the associate email saying that task is assingned with prject info ------------------------------------------------
  res.json({
    message:
      "Associate assigned to task successfully. You can find the task in your progress task section",
    data: updatedTask,
  });
}

//--------------------------------------------------------associate-actions-----------------------------------------------------------------//

taskCtrl.getAllLiveTasks = async (req, res, next) => {
  const features = new QueryHelper(
    Task.find({
      status: "pending",
    }),
    req.query
  )
    .filterAndSearch("title")
    .paginate(6)
    .sort();

  const finalQuery = features.query
    .select("-isVisibleToClient -location -associate -workUpdates")
    .populate("designer", "firstName lastName profilePicture status")
    .lean();

  const myPendingTasks = await finalQuery;

  const total = await Task.countDocuments({ status: "pending" });
  const perPage = parseInt(req.query.limit) || 6;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: myPendingTasks });
}

taskCtrl.getAssociateTasks = async (req, res, next) => {
  const { status } = req.params;
  const features = new QueryHelper(
    Task.find({
      associate: req.user.userId,
      status,
    }),
    req.query
  )
    .filterAndSearch("title")
    .paginate(6)
    .sort();

  const finalQuery = features.query
    .select("-address -isVisibleToClient  -associate -workUpdates")
    .populate("designer", "firstName lastName profilePicture status")
    .lean();

  const myTasks = await finalQuery;

  const total = await Task.countDocuments({ status });
  const perPage = parseInt(req.query.limit) || 6;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: myTasks });
}

taskCtrl.getTaskDettails = async (req, res, next) => {
  const { task_id } = req.params;
  console.log("tesitng");
  const task = await Task.findOne({ _id: task_id, status: "pending" })
    .select("-workUpdates")
    .populate("designer", "firstName lastName profilePicture")
    .lean();
  if (!task) return next(new AppError("task was not found", 400));
  res.json(task);
}

taskCtrl.getMyTaskAssociate = async (req, res, next) => {
  const { task_id } = req.params;
  const task = await Task.findOne({ associate: req.user.userId, _id: task_id })
    .populate("designer", "firstName lastName profilePicture")
    .lean();
  res.json(task);
}

taskCtrl.acceptByAssociate = async (req, res, next) => {
  const { task_id } = req.params;
  const updatedtask = await Task.findByIdAndUpdate(
    task_id,
    { associate: req.user.userId, status: "inprogress" },
    { new: true }
  ).lean();
  if (!updatedtask)
    return next(new AppError("Error while updating the task", 400));
  res.json({
    message: "You assigned to task successfully",
    data: updatedtask,
  });
}

taskCtrl.updateTaskProgress = async (req, res, next) => {
  if (!req.files) return next(new AppError("Files are required", 400));

  const { task_id } = req.params;
  const ip = "206.253.208.100";
  const { description } = req.body;

  const task = await Task.findOne({ _id: task_id, status: "inprogress" });
  if (!task) return next(new AppError("task not found", 404));

  const workUpdate = { description, images: [] };

  try {
    const { latitude: lat, longitude: lng } = await getIpInfo(ip);
    workUpdate.updateLocation = { lat, lng };
  } catch (error) {
    return next(
      new AppError(
        "unable to fetch the ip address please try again with following right guidlines",
        400
      )
    );
  }

  const fileUploadPromises = req.files.map((file) => {
    return CloudinaryService.uploadFile(file);
  });

  const uploadResults = await Promise.all(fileUploadPromises);

  uploadResults.forEach((upload) => {
    workUpdate.images.push({
      url: upload.secure_url,
      public_id: upload.public_id,
    });
  });

  if (workUpdate.images.length === 0) {
    return next(new AppError("upload atleast one image to add into progress"));
  }

  task.workUpdates.push(workUpdate);

  await task.save();

  const updatedWork = JSON.parse(
    JSON.stringify(task.workUpdates[task.workUpdates.length - 1])
  );
  delete updatedWork.updateLocation;

  res.status(200).json({
    message: "work updated successfully",
    data: updatedWork,
  });
}

taskCtrl.deleteProgressItem = async (req, res, next) => {
  const { task_id, delete_id } = req.params;
  const task = await Task.findOne({
    _id: task_id,
    associate: req.user.userId,
    status: "inprogress",
  });
  if (!task)
    return next(new AppError("task was not found to delete prgress Item", 400));

  if (task.workUpdates.length === 0)
    return next(new AppError("there is no work updates to delete", 400));
  const deleteItem = task.workUpdates.find(
    (item) => `${item._id}` === delete_id
  );
  task.workUpdates = task.workUpdates.filter(
    (workItem) => `${workItem._id}` !== delete_id
  );
  task.save();
  const deleteImagesPromises = deleteItem.images.map((image) => {
    return CloudinaryService.deleteFile(image.public_id, "image");
  });

  await Promise.all(deleteImagesPromises);

  res.json({
    message: "item deleted successfully",
    data: { deletedItemId: delete_id },
  });
}

taskCtrl.completeTask = async (req, res, next) => {
  const { task_id } = req.params;
  const task = await Task.findOne({ _id: task_id, status: "inprogress" });
  if (!task) return next(new AppError("task was not found", 400));
  task.status = "completed";
  await task.save();
  res.json({ message: "task completed successfully" });
}

export default taskCtrl;
