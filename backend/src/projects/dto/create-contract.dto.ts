import {
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({
    example: 1000000000,
    description: 'Total contract value in Rupiah',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Nilai kontrak harus berupa number' })
  @IsNotEmpty({ message: 'Nilai kontrak tidak boleh kosong' })
  @Min(100000, { message: 'Nilai kontrak minimal Rp 100.000' })
  totalValue: number;

  @ApiProperty({
    example: 4,
    description: 'Number of terms/milestones',
  })
  @IsInt({ message: 'Jumlah termin harus berupa integer' })
  @IsNotEmpty({ message: 'Jumlah termin tidak boleh kosong' })
  @Min(1, { message: 'Jumlah termin minimal 1' })
  @Max(50, { message: 'Jumlah termin maksimal 50' })
  termCount: number;
}
