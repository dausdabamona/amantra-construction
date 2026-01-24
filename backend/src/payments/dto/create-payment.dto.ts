import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    example: 250000000,
    description: 'Payment amount in Rupiah',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Jumlah pembayaran harus berupa number' })
  @IsNotEmpty({ message: 'Jumlah pembayaran tidak boleh kosong' })
  @Min(100000, { message: 'Jumlah pembayaran minimal Rp 100.000' })
  amount: number;

  @ApiProperty({
    example: 'BANK_TRANSFER',
    description: 'Payment method',
    enum: ['BANK_TRANSFER', 'CASH', 'CHECK'],
  })
  @IsIn(['BANK_TRANSFER', 'CASH', 'CHECK'], {
    message: 'Metode pembayaran harus salah satu dari BANK_TRANSFER, CASH, CHECK',
  })
  @IsNotEmpty({ message: 'Metode pembayaran tidak boleh kosong' })
  method: string;

  @ApiPropertyOptional({
    example: 'BCA 1234567890',
    description: 'Bank account reference',
  })
  @IsOptional()
  @IsString({ message: 'Referensi bank harus berupa string' })
  bankReference?: string;

  @ApiPropertyOptional({
    example: '/uploads/payment_proof_12345.jpg',
    description: 'Payment proof document URL',
  })
  @IsOptional()
  @IsString({ message: 'URL bukti pembayaran harus berupa string' })
  proofUrl?: string;

  @ApiPropertyOptional({
    example: 'Bukti transfer sudah diterima melalui email',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa string' })
  notes?: string;
}
