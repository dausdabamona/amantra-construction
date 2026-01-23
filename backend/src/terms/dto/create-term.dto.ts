import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTermDto {
  @ApiProperty({
    example: 1,
    description: 'Term/milestone number',
  })
  @IsInt({ message: 'Nomor termin harus berupa integer' })
  @IsNotEmpty({ message: 'Nomor termin tidak boleh kosong' })
  @Min(1, { message: 'Nomor termin minimal 1' })
  termNumber: number;

  @ApiProperty({
    example: 'Pekerjaan Pondasi',
    description: 'Term name',
  })
  @IsString({ message: 'Nama termin harus berupa string' })
  @IsNotEmpty({ message: 'Nama termin tidak boleh kosong' })
  name: string;

  @ApiPropertyOptional({
    example: 'Excavation dan foundation work',
    description: 'Term description',
  })
  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  description?: string;

  @ApiProperty({
    example: 25,
    description: 'Percentage of total contract value (0-100)',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Persentase harus berupa number' })
  @IsNotEmpty({ message: 'Persentase tidak boleh kosong' })
  @Min(0.01, { message: 'Persentase minimal 0.01%' })
  @Max(100, { message: 'Persentase maksimal 100%' })
  percentage: number;

  @ApiProperty({
    example: 250000000,
    description: 'Term value in Rupiah',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Nilai termin harus berupa number' })
  @IsNotEmpty({ message: 'Nilai termin tidak boleh kosong' })
  @Min(100000, { message: 'Nilai termin minimal Rp 100.000' })
  value: number;
}
