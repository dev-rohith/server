import joi from "joi";
import { customObjectId } from "./auth-validation.js";

const applicationValidator = joi
  .object({
    description: joi.string().required(),
    requestedRole: joi.string().valid("associate", "designer").required(),
  })
  .options({ abortEarly: false });

const updateApplicationValidator = joi
  .object({
    id: joi.custom(customObjectId, "custom validation"),
    status: joi.string().valid("approved", "rejected").required(),
  })
  .options({ abortEarly: false });

const applicationIdValidator = joi.object({
  id: joi.custom(customObjectId, "custom validation"),
});

export {
  applicationValidator,
  updateApplicationValidator,
  applicationIdValidator,
};
