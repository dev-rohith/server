import { Schema, model } from "mongoose";

const designerProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  company: String,
  position: String,
  experience: Number,
  aboutMe: String,
  languages_know: [String],
  starting_price: Number,
  specializations: [String],
  designStyle: [String],
  softwareExpertise: [String],


  portfolio: [
    {
      title: String,
      description: String,
      images: [
        {
          public_id: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
        },
      ],
      category: String,
      date: Date,
    },
  ],

  average_rating: {
    type: Number,
    default: 0,
  },

  ratings: [
    {
      givenBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      date: { type: Date, default: Date.now },
    },
  ],

  address: {
    street: {
      type: String,
      required: true,
    },
    house_number: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postal_code: {
      type: String,
      required: true,
    },
  },

  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

designerProfileSchema.methods.updateAverageRating = async function () {
  if (this.ratings.length === 0) {
    this.average_rating = 0;
  } else {
    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.average_rating = total / this.ratings.length;
  }
  await this.save();
};

designerProfileSchema.index({ location: "2dsphere" });

const DesignerProfile = model("DesignerProfile", designerProfileSchema);

export default DesignerProfile;
