import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CONTRACTOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: '+62812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'PT Konstruksi Maju' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'Direktur Utama' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'SKA-123456' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'Teknik Sipil' })
  @IsOptional()
  @IsString()
  specialization?: string;
}
