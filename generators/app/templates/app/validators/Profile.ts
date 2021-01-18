import Joi from "joi";

export const ProfileSchema: Joi.ObjectSchema = Joi.object({
  time_zone: Joi.string()
    .max(255)
    .allow(null),
  locale: Joi.string()
    .valid("en", "es")
    .allow(null),
});
