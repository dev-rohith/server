import joi from "joi";
import { Types } from "mongoose";

const customObjectId = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error('invalid object id');
  }
  return value;
};

const userIdValidator = joi.object({
  user_id: joi.string().required().custom(customObjectId, "custom validation")
});

const signupValidator = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    password: joi
      .string()
      .min(6)
      .max(30)
      .required()
      .pattern(
        new RegExp("^(?=.*[A-Z])(?=.*[@#$%^&*!])[a-zA-Z0-9@#$%^&*!]{6,30}$")
      )
      .messages({
        "string.pattern.base":
          "Password must be 6-30 characters long, include at least one uppercase letter and one special character (@#$%^&*!).",
      }),

    email: joi.string().email().required().lowercase(),
  }).options({ abortEarly: false });

const loginValidator = joi.object({
  email: joi.string().email().required().lowercase(),
  password: joi.string().required(),
}).options({ abortEarly: false });

const otpValidator = joi.object({
  otp: joi.number().required(),
  user_id: joi.string().required().custom(customObjectId, "custom validation")
})

const forgotPasswordValidator = joi.object({
  email: joi.string().email().required().lowercase(),
});

const resetPasswordValidator = joi.object({
  password: joi
    .string()
    .min(6)
    .max(30)
    .required()
    .pattern(
      new RegExp("^(?=.*[A-Z])(?=.*[@#$%^&*!])[a-zA-Z0-9@#$%^&*!]{6,30}$")
    )
    .messages({
      "string.pattern.base":
        "Password must be 6-30 characters long, include at least one uppercase letter and one special character.",
    }),
    token: joi.string().required()
});

const deviceIdValidator = joi.object({
  deviceId: joi.string().required(),
});

export {customObjectId, signupValidator, otpValidator , userIdValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, deviceIdValidator };
