import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProgressDto {
  @ApiProperty({
    example: 'Pondasi sudah dikerjakan 80%, siap untuk pengecekan',
    description: 'Progress description',
  })
  @IsString({ message: 'Deskripsi harus berupa string' })
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  description: string;

  @ApiProperty({
    example: 80,
    description: 'Claim percentage (0-100)',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Persentase klaim harus berupa number' })
  @IsNotEmpty({ message: 'Persentase klaim tidak boleh kosong' })
  @Min(0.01, { message: 'Persentase klaim minimal 0.01%' })
  @Max(100, { message: 'Persentase klaim maksimal 100%' })
  claimPercentage: number;

  @ApiPropertyOptional({
    example: '/uploads/progress_12345.jpg',
    description: 'Photo URL (will be set by server after upload)',
  })
  @IsOptional()
  @IsString({ message: 'Photo URL harus berupa string' })
  photoUrl?: string;
}
