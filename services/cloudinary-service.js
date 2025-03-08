import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CloudinaryService = {
  async uploadFile(file, type) {
    try {
      if (!file || !file.path) {
        throw new Error("Invalid file path");
      }

      if (!fs.existsSync(file.path)) {
        throw new Error("File does not exist at path: " + file.path);
      }

      console.log("cloudianry hit");

      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: type || "auto",
      });

      return result;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new Error(error.message);
    }
  },

  async deleteFile(publicId, type) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type || "raw",
      });
      return result;
    } catch (error) {
      console.error("Cloudinary delete failed:", error);
      throw new Error(error.message);
    }
  },
};

export default CloudinaryService;
