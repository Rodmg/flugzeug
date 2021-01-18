import Joi from "joi";

export const UserSchema: Joi.ObjectSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .allow(null),
  email: Joi.string()
    .email()
    .max(255),
  password: Joi.string()
    .min(8)
    .max(255),
  role: Joi.string().valid("user", "admin"),
});
