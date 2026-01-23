import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVerificationDto {
  @ApiProperty({
    example: 'APPROVED',
    description: 'Verification status',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsIn(['APPROVED', 'REJECTED'], {
    message: 'Status harus APPROVED atau REJECTED',
  })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  status: string;

  @ApiPropertyOptional({
    example: 'Pekerjaan sudah sesuai spesifikasi dan rencana',
    description: 'Verification notes/comments',
  })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa string' })
  notes?: string;
}
