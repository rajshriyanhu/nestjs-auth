import { Request } from 'express';

export interface IUserAuthInfoRequest extends Request {
  user: {
    userId: string;
    tenantId: string;
  };
}