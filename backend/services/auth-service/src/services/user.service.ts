import { User, UpdateUserRequest } from '@hospital/shared/src/types/user.types';
import { UserRepositoryFactory, IUserRepository } from '../repositories/user-repository.factory';
import { NotFoundError } from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

export class UserService {
  private userRepository: IUserRepository;

  constructor() {
    this.userRepository = UserRepositoryFactory.getInstance();
  }

  async getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User', id);
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error getting user by ID', { error, id });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error getting user by email', { error, email });
      throw error;
    }
  }

  async getAllUsers(limit: number = 50, offset: number = 0): Promise<Omit<User, 'password_hash'>[]> {
    try {
      const users = await this.userRepository.findAll(limit, offset);
      
      // Remove passwords from response
      return users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      logger.error('Error getting all users', { error, limit, offset });
      throw error;
    }
  }

  async getUsersByRole(role: string, limit: number = 50, offset: number = 0): Promise<Omit<User, 'password_hash'>[]> {
    try {
      const users = await this.userRepository.findByRole(role, limit, offset);
      
      // Remove passwords from response
      return users.map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      logger.error('Error getting users by role', { error, role, limit, offset });
      throw error;
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<Omit<User, 'password_hash'> | null> {
    try {
      const updatedUser = await this.userRepository.update(id, userData);
      if (!updatedUser) {
        throw new NotFoundError('User', id);
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error updating user', { error, id, userData });
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<void> {
    try {
      await this.userRepository.deactivate(id);
      logger.info('User deactivated', { userId: id });
    } catch (error) {
      logger.error('Error deactivating user', { error, id });
      throw error;
    }
  }

  async activateUser(id: string): Promise<void> {
    try {
      await this.userRepository.activate(id);
      logger.info('User activated', { userId: id });
    } catch (error) {
      logger.error('Error activating user', { error, id });
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const deleted = await this.userRepository.delete(id);
      if (!deleted) {
        throw new NotFoundError('User', id);
      }
      logger.info('User deleted', { userId: id });
    } catch (error) {
      logger.error('Error deleting user', { error, id });
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    try {
      return await this.userRepository.count();
    } catch (error) {
      logger.error('Error getting user count', { error });
      throw error;
    }
  }

  async getUserCountByRole(role: string): Promise<number> {
    try {
      return await this.userRepository.countByRole(role);
    } catch (error) {
      logger.error('Error getting user count by role', { error, role });
      throw error;
    }
  }
}
