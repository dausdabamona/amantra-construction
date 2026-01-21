import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ description: 'ID Proyek' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ example: 'Kontrak Pembangunan Gedung A Tahap 1' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Kontrak untuk pembangunan struktur utama' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Pekerjaan struktur beton bertulang lantai 1-3',
    description: 'Lingkup pekerjaan',
  })
  @IsString()
  scope: string;

  @ApiProperty({ example: 2500000000 })
  @IsNumber()
  @Min(0)
  totalValue: number;

  @ApiPropertyOptional({ example: 'IDR', default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Persentase retensi',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  retentionPercentage?: number;

  @ApiPropertyOptional({ description: 'Syarat dan ketentuan (JSON)' })
  @IsOptional()
  @IsString()
  termsConditions?: string;
}
