import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { CreateTermDto } from '../terms/dto/create-term.dto';

describe('DTOs Validation', () => {
  describe('LoginDto', () => {
    it('should validate correct login credentials', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with short password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: '123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail with missing email', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateProjectDto', () => {
    it('should validate correct project data', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Proyek Konstruksi A',
        description: 'Deskripsi proyek',
        location: 'Jakarta',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with missing project name', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        description: 'Deskripsi proyek',
        location: 'Jakarta',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow optional fields', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Proyek Konstruksi A',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateTermDto', () => {
    it('should validate correct term data', async () => {
      const dto = plainToInstance(CreateTermDto, {
        termNumber: 1,
        name: 'Pekerjaan Pondasi',
        percentage: 25,
        value: 250000000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with percentage > 100', async () => {
      const dto = plainToInstance(CreateTermDto, {
        termNumber: 1,
        name: 'Pekerjaan Pondasi',
        percentage: 150,
        value: 250000000,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('percentage');
    });

    it('should fail with value < minimum', async () => {
      const dto = plainToInstance(CreateTermDto, {
        termNumber: 1,
        name: 'Pekerjaan Pondasi',
        percentage: 25,
        value: 50000, // Less than 100000 minimum
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('value');
    });

    it('should fail with termNumber < 1', async () => {
      const dto = plainToInstance(CreateTermDto, {
        termNumber: 0,
        name: 'Pekerjaan Pondasi',
        percentage: 25,
        value: 250000000,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('termNumber');
    });
  });
});
