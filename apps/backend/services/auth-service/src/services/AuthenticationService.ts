import bcrypt from 'bcryptjs';
import { BaseService } from '@nm/api-base';
import { ErrorFactory } from '@nm/errors';
import { IdentityRepository } from '../repositories/IdentityRepository';
import { IdentityStatus } from '../generated/client';

export class AuthenticationService extends BaseService {
  private identityRepo: IdentityRepository;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    super('AuthenticationService');
    this.identityRepo = new IdentityRepository();
  }

  public async verifyCredentials(email: string, plainText: string) {
    const identity = await this.identityRepo.findByEmail(email);
    if (!identity) {
      throw ErrorFactory.unauthorized('Invalid email or password');
    }

    if (identity.status === IdentityStatus.LOCKED) {
      if (identity.lockedUntil && identity.lockedUntil > new Date()) {
        throw ErrorFactory.unauthorized('Account is locked due to too many failed attempts.');
      } else {
        // Lock expired, reset
        await this.identityRepo.update(identity.id, {
          status: IdentityStatus.ACTIVE,
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
        identity.status = IdentityStatus.ACTIVE;
      }
    } else if (identity.status !== IdentityStatus.ACTIVE) {
      throw ErrorFactory.unauthorized(`Account status is ${identity.status}`);
    }

    const isValid = await bcrypt.compare(plainText, identity.passwordHash);

    if (!isValid) {
      const attempts = identity.failedLoginAttempts + 1;
      const isLocked = attempts >= this.MAX_FAILED_ATTEMPTS;

      await this.identityRepo.update(identity.id, {
        failedLoginAttempts: attempts,
        status: isLocked ? IdentityStatus.LOCKED : identity.status,
        lockedUntil: isLocked ? new Date(Date.now() + this.LOCKOUT_DURATION_MS) : null,
      });

      throw ErrorFactory.unauthorized('Invalid email or password');
    }

    // Reset failed attempts on success
    if (identity.failedLoginAttempts > 0) {
      await this.identityRepo.update(identity.id, { failedLoginAttempts: 0 });
    }

    return identity;
  }

  public async changePassword(
    identityId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
    if (!identityId) {
      throw ErrorFactory.unauthorized('Authentication required');
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw ErrorFactory.validation('Current password, new password, and confirmation are required');
    }

    if (newPassword !== confirmPassword) {
      throw ErrorFactory.validation('New password and confirmation password do not match');
    }

    if (newPassword.length < 8) {
      throw ErrorFactory.validation('New password must be at least 8 characters long');
    }

    const identity = await this.identityRepo.findById(identityId);
    if (!identity) {
      throw ErrorFactory.notFound('User identity not found');
    }

    const isValid = await bcrypt.compare(currentPassword, identity.passwordHash);
    if (!isValid) {
      throw ErrorFactory.unauthorized('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.identityRepo.update(identity.id, { passwordHash });

    return { message: 'Password updated successfully' };
  }

  public async deleteAccount(identityId: string) {
    if (!identityId) {
      throw ErrorFactory.unauthorized('Authentication required');
    }

    const identity = await this.identityRepo.findById(identityId);
    if (!identity) {
      throw ErrorFactory.notFound('User identity not found');
    }

    // Soft delete strategy to prevent cascading deletion breaks across independent microservice databases
    await this.identityRepo.update(identity.id, {
      status: IdentityStatus.INACTIVE,
    });

    return { message: 'Account deleted successfully' };
  }
}
