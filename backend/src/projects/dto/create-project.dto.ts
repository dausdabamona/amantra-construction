import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Proyek Konstruksi Gedung A',
    description: 'Project name',
  })
  @IsString({ message: 'Nama proyek harus berupa string' })
  @IsNotEmpty({ message: 'Nama proyek tidak boleh kosong' })
  name: string;

  @ApiPropertyOptional({
    example: 'Konstruksi gedung perkantoran 10 lantai',
    description: 'Project description',
  })
  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Jl. Sudirman No. 1, Jakarta',
    description: 'Project location',
  })
  @IsOptional()
  @IsString({ message: 'Lokasi harus berupa string' })
  location?: string;

  @ApiPropertyOptional({
    example: 'uuid-contractor-id',
    description: 'Contractor user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Contractor ID harus UUID valid' })
  contractorId?: string;

  @ApiPropertyOptional({
    example: 'uuid-supervisor-id',
    description: 'Supervisor user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Supervisor ID harus UUID valid' })
  supervisorId?: string;

  @ApiPropertyOptional({
    example: 'uuid-witness-id',
    description: 'Witness user ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Witness ID harus UUID valid' })
  witnessId?: string;
}
