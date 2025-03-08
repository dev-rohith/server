import { Schema, model } from "mongoose";

const landingConfigSchema = new Schema({
  carousel: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String, 
        required: true,
      },
      resource_type: {
        type: String,
        required: true,
      },
    },
  ],
  designers: [
    {
      name: String,
      profilePicture: String,
      aboutMe: String,
    },
  ],
  customer_reviews: [
    {
      name: String,
      video: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String, 
          required: true,
        },
        resource_type: {
          type: String,
          required: true,
        },
      },
      review: String,
    },
  ],
});

const LandingConfig = model("LandingConfig", landingConfigSchema);

export default LandingConfig;
