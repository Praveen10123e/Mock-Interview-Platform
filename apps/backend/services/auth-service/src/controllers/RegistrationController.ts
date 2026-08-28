import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@nm/api-base';
import { RegistrationService } from '../services/RegistrationService';

export class RegistrationController extends BaseController {
  private registrationService: RegistrationService;

  constructor() {
    super();
    this.registrationService = new RegistrationService();
  }

  public registerStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    try {
      const { email, password, firstName, lastName, fullName, name } = req.body;
      const identity = await this.registrationService.register(
        email,
        password,
        'STUDENT',
        firstName,
        lastName,
        fullName || name
      );
      return (this as any).sendCreated(
        res,
        { id: identity.id, email: identity.email },
        'Student registered successfully',
      );
    } catch (error) {
      next(error);
    }
  };

  public registerFaculty = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    try {
      const { email, password, firstName, lastName, fullName, name } = req.body;
      const identity = await this.registrationService.register(
        email,
        password,
        'FACULTY',
        firstName,
        lastName,
        fullName || name
      );
      return (this as any).sendCreated(
        res,
        { id: identity.id, email: identity.email },
        'Faculty registered successfully',
      );
    } catch (error) {
      next(error);
    }
  };

  public registerAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { email, password, firstName, lastName, fullName, name } = req.body;
      const identity = await this.registrationService.register(
        email,
        password,
        'ADMINISTRATOR',
        firstName,
        lastName,
        fullName || name
      );
      return (this as any).sendCreated(
        res,
        { id: identity.id, email: identity.email },
        'Admin registered successfully',
      );
    } catch (error) {
      next(error);
    }
  };
}
