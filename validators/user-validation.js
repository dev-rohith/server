import joi from "joi";
import { customObjectId } from "./auth-validation.js";

const userPasswordValidator = joi.object({
  currentPassword: joi.string().required(),
  newPassword: joi
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
});

const userStatusChangeValidator = joi.object({
  user_id: joi
    .string()
    .required()
    .custom(customObjectId, "custom validation")
    .messages({ "string.custom": "Invalid user ID" }),
  status: joi
    .string()
    .required()
    .valid("active", "suspended")
    .messages({ "any.only": "Invalid action" }),
});

export { userPasswordValidator, userStatusChangeValidator };
