import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email harus valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString({ message: 'Nama harus berupa string' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({
    example: 'OWNER',
    description: 'User role',
    enum: ['OWNER', 'CONTRACTOR', 'SUPERVISOR', 'WITNESS'],
  })
  @IsIn(['OWNER', 'CONTRACTOR', 'SUPERVISOR', 'WITNESS'], {
    message: 'Role harus salah satu dari OWNER, CONTRACTOR, SUPERVISOR, WITNESS',
  })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role: string;

  @ApiPropertyOptional({
    example: '+62812345678',
    description: 'User phone number',
  })
  @IsOptional()
  @IsPhoneNumber('ID', { message: 'Nomor telepon harus valid' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'PT Contoh Konstruksi',
    description: 'User company name',
  })
  @IsOptional()
  @IsString({ message: 'Nama perusahaan harus berupa string' })
  company?: string;
}
