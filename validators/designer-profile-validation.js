import Joi from "joi";

const addressSchema = Joi.object({
  street: Joi.string().min(3).max(100).required(),
  house_number: Joi.string().max(10),
  city: Joi.string().min(2).max(50).required(),
  state: Joi.string().min(2).max(50).required(),
  country: Joi.string().min(2).max(50).required(),
  postal_code: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
});

const desingerProfile = Joi.object({
  company: Joi.string().min(2).max(100).required(),
  position: Joi.string().min(2).max(50).required(),
  experience: Joi.number().integer().min(0).max(50).required(),
  aboutMe: Joi.string().min(5).max(500).required(),

  specializations: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .required(),
  designStyle: Joi.array().items(Joi.string().min(2).max(50)).min(1).required(),
  softwareExpertise: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .required(),
  languages_know: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .required(),

  starting_price: Joi.number().min(1).max(1000000).required(),

  address: addressSchema.required(),
})
  .options({ abortEarly: false })
  .unknown(true);

export const validateDesingerProfile = (req, res, next) => {
  const { error } = desingerProfile.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  next();
};
