import { Response } from 'express';

export class BusinessError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export function handleError(res: Response, error: any, defaultMessage: string) {
  if (error instanceof BusinessError) {
    res.status(error.status).json({ success: false, message: error.message });
  } else {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || defaultMessage });
  }
}
