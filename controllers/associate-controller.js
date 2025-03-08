import AssociateProfile from "../models/associate-profile-model.js";
import { getCoordinates } from "../services/georeverse-coding.js";
import QueryHelper from "../utils/query-helper.js";
import AppError from "../utils/app-error-util.js";
import catchErrors from "../utils/catch-async-util.js";

const associateProfileCtrl = {};

associateProfileCtrl.createProfile = async (req, res, next) => {
  const { bio, skills, address } = req.body;

  const { lng, lat } = await getCoordinates(address);

  if (!lat || !lng)
    return next(new AppError("please provide valid address", 400));

  const profile = await AssociateProfile.create({
    user: req.user.userId,
    bio,
    skills,
    address,
    location: {
      coordinates: [lat, lng],
    },
  });

  if (!profile) return next(new AppError("error while creating profile", 500));
  res.json({ message: "profile created successfully", data: profile });
};

associateProfileCtrl.updateProfile = async (req, res, next) => {
  const { bio, skills, address, availability } = req.body;
  const { lat, lng } = await getCoordinates(address);

  if (!lat || !lng)
    return next(new AppError("please provide valid address", 400));

  const newProfile = {
    bio,
    skills,
    address,
    availability,
    address,
    location: {
      type: "Point",
      coordinates: [lat, lng],
    },
  };
  const updatedProfile = await AssociateProfile.findOneAndUpdate(
    { user: req.user.userId },
    newProfile,
    { new: true }
  )
    .select("-user -_id -__v -location")
    .lean();
  if (!updatedProfile)
    return next(new AppError("user profile not found to update", 404));
  res.json({
    message: "Your profile updated successfully",
    data: updatedProfile,
  });
};

associateProfileCtrl.getMyProfile = async (req, res, next) => {
  const profile = await AssociateProfile.findOne({ user: req.user.userId })
    .select("-user -_id -__v -location")
    .lean();
  if (!profile)
    return next(new AppError("profile not found first create a profile", 404));
  res.json(profile);
};

associateProfileCtrl.getAssociates = async (req, res, next) => {
  const features = new QueryHelper(AssociateProfile, req.query)
    .filterAndSearch()
    .sort()
    .paginate();

  const finalQuery = features.query
    .select("availability skills bio completedTasksCount")
    .populate("user", "firstName lastName profilePicture")
    .lean();
  const associates = await finalQuery;
  res.json(associates);
};

associateProfileCtrl.getNearestAssociates = async (req, res, next) => {
  const { coordinates, distance } = req.body;
  const nearestAssociates = await AssociateProfile.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: (distance || 1) * 1000,
      },
    },
  })
    .select("user skills availability")
    .populate("user", "firstName lastName profilePicture status");
  res.json(nearestAssociates);
};

export default associateProfileCtrl;
