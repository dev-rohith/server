import multer from "multer";
import fs from "fs";
import path from "path";

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const destinationDir = path.join(process.cwd(), "uploads", "temporary");
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    cb(null, destinationDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Custom filter based on allowed MIME types
const customFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("File type not allowed!"), false);
    }
    cb(null, true);
  };
};

export const uploadAvatar = (allowedTypes) => {
  return multer({
    storage: multerStorage,
    fileFilter: customFileFilter(allowedTypes),
    limits: 1024 * 1024 * 5,
    files: 1,
  }).single("image");
};

export const uploadSingleFile = (allowedTypes, fileName, maxFileSize) => {
  return multer({
    storage: multerStorage,
    fileFilter: customFileFilter(allowedTypes),
    limits: {
      fileSize: maxFileSize,
    },
  }).single(fileName);
};

export const uploadMultipleFiles = (allowedTypes, maxFileSize, maxFiles) => {
  return multer({
    storage: multerStorage,
    fileFilter: customFileFilter(allowedTypes),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
  }).array("files", maxFiles);
};
