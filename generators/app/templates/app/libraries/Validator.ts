import Joi from "joi";
import { Request, Response } from "express";
import { Controller } from "@/libraries/Controller";

export const idValue = () =>
  Joi.number()
    .integer()
    .min(1)
    .max(2147483647);

export const decimalString = () =>
  Joi.string().pattern(/^-?\d+(\.\d+(e\d+)?)?$/, "decimal");

const validatorOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  convert: false,
  errors: {
    escapeHtml: true,
  },
};

const getErrorDetails = (error: Joi.ValidationError) =>
  error.details.map(detail => ({
    property: detail.path[0],
    error: detail.message,
  }));

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: Function) => {
    const { error, value } = schema.validate(req.body, validatorOptions);

    if (error) {
      return Controller.badRequest(res, getErrorDetails(error));
    }

    req.body = value;
    next();
  };
}
