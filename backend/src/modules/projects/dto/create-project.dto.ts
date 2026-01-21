import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Pembangunan Gedung A' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Proyek pembangunan gedung perkantoran 5 lantai' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Jl. Sudirman No. 123, Jakarta' })
  @IsString()
  location: string;

  @ApiProperty({ example: 5000000000 })
  @IsNumber()
  @Min(0)
  estimatedBudget: number;

  @ApiPropertyOptional({ example: 'IDR', default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ID Kontraktor yang ditunjuk' })
  @IsOptional()
  @IsUUID()
  contractorId?: string;

  @ApiPropertyOptional({ description: 'Daftar ID Pengawas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  supervisorIds?: string[];

  @ApiPropertyOptional({ description: 'Daftar ID Saksi Ahli', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  witnessIds?: string[];
}
