import DesignerProfile from "../models/designer-profile-model.js";
import Project from "../models/project-model.js";
import CloudinaryService from "../services/cloudinary-service.js";
import { getCoordinates } from "../services/georeverse-coding.js";
import QueryHelper from "../utils/query-helper.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";
import fs from "fs";

const projectCtrl = {};

projectCtrl.createProject = async (req, res, next) => {
  const { title, description, client, address, minimumDays, budget } = req.body;

  const { lat, lng } = await getCoordinates(address);

  await Project.create({
    title,
    description,
    client,
    address,
    minimumDays,
    budget,
    location: { lat, lng },
    designer: req.user.userId,
  });

  res.json({ message: "project created successfully" });
}

projectCtrl.getProject = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id)
    .populate("designer", "firstName lastName profilePicture")
    .populate("client", "firstName lastName profilePicture");

  if (!project) return next(new AppError("project not found", 404));
  res.json(project);
}

projectCtrl.editProject = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "pending") {
    return next(
      new AppError(
        "Project is in progress; only progress updates are allowed",
        400
      )
    );
  }

  const { title, description, budget, address, minimumDays } = req.body;
  const { lat, lng } = await getCoordinates(address);

  Object.assign(project, {
    title,
    description,
    budget,
    address,
    minimumDays,
    location: { lat, lng },
  });
  const updatedProject = await project.save();

  res.json({
    message: "Project updated successfully",
    data: {
      title: updatedProject.title,
      description: updatedProject.description,
      budget: updatedProject.budget,
      address: updatedProject.address,
      minimumDays: updatedProject.minimumDays,
      location: updatedProject.location,
    },
  });
}

projectCtrl.deleteProject = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "pending") {
    return next(
      new AppError(
        "Project is in progress; only progress updates are allowed",
        400
      )
    );
  }

  await Project.findByIdAndDelete(project_id);

  res.json({ message: "Project deleted successfully" });
}

projectCtrl.getMyProjectsDesigner = async (req, res, next) => {
  const { status } = req.params;
  const features = new QueryHelper(
    Project.find({
      designer: req.user.userId,
      status,
    }),
    req.query
  )
    .filterAndSearch("title")
    .paginate(6)
    .sort();

  const finalQuery = features.query
    .populate("client", "firstName lastName profilePicture")
    .select("title description budget minimumDays isPaid createdAt")
    .lean();
  const myPendingProjects = await finalQuery;

  const total = await Project.countDocuments({ status });
  const perPage = parseInt(req.query.limit) || 6;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: myPendingProjects });
}

projectCtrl.getMyProjectsClient = async (req, res, next) => {
  const { status } = req.params;
  const features = new QueryHelper(
    Project.find({
      client: req.user.userId,
      status,
    }),
    req.query
  )
    .filterAndSearch("title")
    .paginate(8)
    .sort();

  const finalQuery = features.query
    .populate("designer", "firstName lastName profilePicture")
    .select("title description budget  minimumDays isPaid createdAt updatedAt")
    .lean();
  const myPendingProjects = await finalQuery;

  const total = await Project.countDocuments({ status });
  const perPage = parseInt(req.query.limit) || 6;
  const totalPages = Math.ceil(total / perPage);
  const page = parseInt(req.query.page) || 1;

  res.json({ page, perPage, totalPages, total, data: myPendingProjects });
}

projectCtrl.updateProjectProgress = async (req, res, next) => {
  const { project_id } = req.params;

  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "inprogress") {
    return next(
      new AppError(
        "your project not in progress state; you can't update progress",
        400
      )
    );
  }

  const { milestones, completion_percentage } = req.body;

  Object.assign(project, { milestones, completion_percentage });

  project.save();

  res.json({
    message: "progress updated successfully",
    data: { milestones, completion_percentage },
  });
}

projectCtrl.addBeforeProjectToPortfolio = 
  async (req, res, next) => {
    const { project_id } = req.params;
    const project = await Project.findById(project_id);

    if (!project) return next(new AppError("Project not found", 400));
    if (project.status !== "review")
      return next(
        new AppError("You can only upload items in review state", 400)
      );
    if (!req.file)
      return next(new AppError("Upload an image to add to portfolio", 400));

    const uploadResult = await CloudinaryService.uploadFile(req.file);

    try {
      await fs.promises.unlink(req.file.path);
    } catch (unlinkError) {
      console.error("Error while deleting the file:", unlinkError.message);
    }

    project.beforePictures.push({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

    await project.save();

    res.json({
      message: "Uploaded successfully",
      data: project.beforePictures[project.beforePictures.length - 1],
    });
  }


projectCtrl.deleteBeforeProjectToPortifolio = 
  async (req, res, next) => {
    const { project_id, Item_id } = req.params;
    const project = await Project.findById(project_id);

    if (!project) return next(new AppError("project is not found", 404));

    const removedItem = project.beforePictures.find(
      (item) => item.public_id === Item_id
    );

    project.beforePictures = project.beforePictures.filter(
      (item) => item.public_id !== Item_id
    );
    await CloudinaryService.deleteFile(removedItem.public_id, "image");
    await project.save();
    res.json({
      message: "item is successfully removed from before list",
      data: removedItem,
    });
  }


projectCtrl.addAfterProjectToPortfolio = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id);

  if (!project) return next(new AppError("Project not found", 400));
  if (project.status !== "review")
    return next(new AppError("You can only upload in review state", 400));
  if (!req.file)
    return next(new AppError("Upload an image to add to portfolio", 400));

  const uploadResult = await CloudinaryService.uploadFile(req.file);

  try {
    await fs.promises.unlink(req.file.path);
  } catch (unlinkError) {
    console.error("Error while deleting the file:", unlinkError.message);
  }

  project.afterPictures.push({
    url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
  });

  await project.save();

  res.json({
    message: "Uploaded successfully",
    data: project.afterPictures[project.afterPictures.length - 1],
  });
}

projectCtrl.deleteAfterProjectToPortifolio = 
  async (req, res, next) => {
    const { project_id, Item_id } = req.params;
    const project = await Project.findById(project_id);

    if (!project) return next(new AppError("project is not found", 404));

    const removedItem = project.afterPictures.find(
      (item) => item.public_id === Item_id
    );

    project.afterPictures = project.afterPictures.filter(
      (item) => item.public_id !== Item_id
    );
    await CloudinaryService.deleteFile(removedItem.public_id, "image");
    await project.save();
    res.json({
      message: "item is successfully removed from after list",
      data: removedItem,
    });
  }


projectCtrl.sentProjectToReview = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "inprogress")
    return next(new AppError("Project is not in progress", 400));
  if (project.completion_percentage !== 100)
    return next(
      new AppError(
        "Project is not completed project completion percentage should be 100% to be sent to review",
        400
      )
    );
  project.status = "review";
  project.save();
  res.json({ message: "Project is successfully sent to review" });
}

projectCtrl.acceptProject = async (req, res, next) => {
  const { project_id } = req.params;
  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "pending")
    return next(
      new AppError(
        "Project is not in Pending stage its already in progress",
        400
      )
    );
  project.status = "inprogress";
  project.save();
  res.json({
    message:
      "Project is successfully accepted you can see it in your inprogress projects",
  });
}

projectCtrl.clientRating = async (req, res, next) => {
  const { project_id } = req.params;
  const { projectReview, designerRating, designerReview } = req.body;

  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("Project not found", 404));
  if (project.status !== "review")
    return next(new AppError("Project is not in review stage", 400));
  if (project.review)
    return next(
      new AppError("Project is already reviewed You cant do it again", 400)
    );
  project.review = projectReview;
  const designer = await DesignerProfile.findOne({ user: project.designer });

  if (!designer) return next(new AppError("Designer not found", 404));

  designer.ratings.push({
    givenBy: req.user.userId,
    rating: designerRating,
    review: designerReview,
  });

  await project.save();
  await designer.updateAverageRating();

  res.json({ message: "Project review is successfully submitted" });
}

projectCtrl.complete = async (req, res, next) => {
  const { project_id } = req.params;

  const project = await Project.findById(project_id);
  if (!project) return next(new AppError("project is not found", 404));

  if (project.status !== "review")
    return next(
      new AppError("You can only complete the project in review state", 400)
    );
  if (!project.review)
    return next(
      new AppError(
        "You can't complete the project without review! Take an review from the customer side first to complete the project!",
        400
      )
    );
  if (project.beforePictures.length === 0 && project.afterPictures.length === 0)
    next(
      new AppError(
        "Add atleast one image on before and after project to complete",
        400
      )
    );

  project.status = "completed";
  project.save();
  res.json({ message: "project is successfully completed" });
}

export default projectCtrl;
