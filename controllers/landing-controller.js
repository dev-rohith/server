import catchErrors from "../utils/catch-async-util.js";
import LandingConfig from "../models/landingConfig-model.js";
import CloudinaryService from "../services/cloudinary-service.js";

import fs from "fs";
import AppError from "../utils/app-error-util.js";
import { RedisDataManager } from "../services/redis-service.js";
import DesignerProfile from "../models/designer-profile-model.js";

const landingCtrl = {};

landingCtrl.getLanding = async (req, res, next) => {
  let config = await RedisDataManager.getItemFromRedis("landingConfig");

  if (!config) {
    config = await LandingConfig.findOne()
      .select("-_id -__v  -carousel._id")
      .lean();

    if (!config) {
      return next(
        new AppError(
          "There is no landingConfig! Admin needs to create at least one item immediately.",
          400
        )
      );
    }

    const designerLocations = await DesignerProfile.find()
      .select("location.coordinates address.city address.country -_id")
      .lean();
    config.designers_locations =
      designerLocations.length >= 1 ? designerLocations : [];

    await RedisDataManager.addItemToRedis(
      "landingConfig",
      JSON.stringify(config)
    );
  } else {
    config = JSON.parse(config);
  }

  res.status(200).json(config);
}

landingCtrl.createCarouselItem = async (req, res, next) => {
  let filePath = req.file?.path;
  if (!filePath) return next(new AppError("file must need to upload", 400));

  try {
    const { resource_type, secure_url, public_id } =
      await CloudinaryService.uploadFile(req.file);
    const newCarouselItem = {
      url: secure_url,
      resource_type,
      public_id,
    };
    const newConfig = await LandingConfig.findOneAndUpdate(
      {},
      { $push: { carousel: newCarouselItem } },
      { upsert: true, new: true }
    );
    //delete the item from the redis for persistance
    await RedisDataManager.removeItemFromRedis("landingConfig");

    res.status(201).json({
      message: "New Carousel ttem has been added successfully",
      data: newCarouselItem,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error while deleting the file:", unlinkError.message);
    }
  }
};

landingCtrl.addTopDesigner = async (req, res, next) => {
  const { name, profilePicture, aboutMe } = req.body;
  if (!name || !profilePicture || !aboutMe)
    return next(new AppError("desinger details is needed", 400));

  const newTopDesinger = {
    name,
    profilePicture,
    aboutMe,
  };

  const updatedDoc = await LandingConfig.findOneAndUpdate(
    {},
    { $push: { designers: newTopDesinger } },
    { upsert: true, new: true }
  );

  const addedDesigner = updatedDoc?.designers?.slice(-1)[0];

  await RedisDataManager.removeItemFromRedis("landingConfig");
  res.json({
    message: "Designer added successfully",
    data: addedDesigner,
  });
}

landingCtrl.addCustomerReview = async (req, res, next) => {
  const { name, review } = req.body;
  if (!name || !review)
    return next(new AppError("video review must need to upload", 400));
  let filePath = req.file?.path;

  if (!filePath)
    return next(new AppError("video review must need to upload", 400));
  try {
    const { resource_type, secure_url, public_id } =
      await CloudinaryService.uploadFile(req.file);
    const newReview = {
      name,
      video: {
        url: secure_url,
        resource_type,
        public_id,
      },
      review,
    };

    await LandingConfig.findOneAndUpdate(
      {},
      { $push: { customer_reviews: newReview } },
      { upsert: true, new: true }
    );
    //delete the item from the redis for persistance
    await RedisDataManager.removeItemFromRedis("landingConfig");

    res.status(201).json({
      message: "review uploaded successfully",
      data: newReview,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error while deleting the file:", unlinkError.message);
    }
  }
}

landingCtrl.deleteCarouselItem = async (req, res, next) => {
  const { public_id } = req.params;

  const config = await LandingConfig.findOne({
    "carousel.public_id": public_id,
  });

  if (!config) {
    return next(new AppError("Carousel item not found", 404));
  }
  // Find the item to be deleted before removing it
  const deletedItem = config.carousel.find(
    (item) => item.public_id === public_id
  );

  // Remove the carousel item from the array
  config.carousel = config.carousel.filter(
    (item) => item.public_id !== public_id
  );

  // Save the updated config
  await config.save();

  await CloudinaryService.deleteFile(public_id);
  await RedisDataManager.removeItemFromRedis("landingConfig");

  res.json({
    message: "carousel item deleted successfully",
    data: deletedItem,
  });
  // await CloudinaryService.deleteFile()
}

landingCtrl.deleteTopDesigner = async (req, res, next) => {
  const { desinger_id } = req.params;

  const config = await LandingConfig.findOne({ "designers._id": desinger_id });

  if (!config) {
    return next(new AppError("Designer not found in configuration", 404));
  }
  const deletedItem = config.designers.find(
    (item) => `${item._id}` === desinger_id
  );

  // Remove the designer ID from the designers array using $pull
  config.designers = config.designers.filter(
    (item) => `${item._id}` !== desinger_id
  );

  // Save the updated document
  await config.save();

  await RedisDataManager.removeItemFromRedis("landingConfig");

  res.status(200).json({
    message: "Designer removed from the landing configuration successfully.",
    data: deletedItem,
  });
}

landingCtrl.deleteCustomerReview = async (req, res, next) => {
  const { public_id } = req.params;

  const config = await LandingConfig.findOne({
    "customer_reviews.video.public_id": public_id,
  });

  if (!config) {
    return next(new AppError("customer not found in configuration", 404));
  }

  const deletedItem = config.customer_reviews.find(
    (review) => review.video.public_id === public_id
  );

  config.customer_reviews = config.customer_reviews.filter(
    (review) => review.video.public_id !== public_id
  );

  config.save();

  await CloudinaryService.deleteFile(public_id);
  await RedisDataManager.removeItemFromRedis("landingConfig");

  res.status(200).json({
    message:
      "customer review removed from the landing configuration successfully.",
    data: deletedItem,
  });
}

export default landingCtrl;
