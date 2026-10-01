import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
  next();
}
