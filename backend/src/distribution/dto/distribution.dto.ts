import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsEnum, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum DistributionWaitingState {
  WAITING_FOR_ESCROW_RELEASE = 'WAITING_FOR_ESCROW_RELEASE',
  WAITING_FOR_TRANSFER_CONFIRMATION = 'WAITING_FOR_TRANSFER_CONFIRMATION',
}

export enum TxStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export class PrepareDistributionDto {
  @ApiProperty({ description: 'Konfirmasi menyiapkan distribusi final', example: true })
  @IsBoolean({ message: 'confirm harus boolean' })
  confirm: boolean;

  @ApiProperty({ description: 'Catatan tambahan', required: false })
  @IsOptional()
  @IsString({ message: 'notes harus berupa string' })
  notes?: string;
}

export class ExecuteDistributionDto {
  @ApiProperty({ description: 'Hash transaksi on-chain jika ada', required: false })
  @IsOptional()
  @IsString({ message: 'txHash harus berupa string' })
  txHash?: string;
}

export class DistributionInstructionDto {
  @ApiProperty({ description: 'Penerima', example: '0xInvestor' })
  @IsString({ message: 'beneficiary harus berupa string' })
  beneficiary: string;

  @ApiProperty({ description: 'Peran penerima', example: 'INVESTOR' })
  @IsString({ message: 'role harus berupa string' })
  role: string;

  @ApiProperty({ description: 'Jumlah', example: 7000000000 })
  @IsNumber({}, { message: 'amount harus berupa angka' })
  amount: number;

  @ApiProperty({ description: 'Status instruksi', example: 'PENDING' })
  @IsString({ message: 'status harus berupa string' })
  status: string;

  @ApiProperty({ description: 'Hash transaksi', required: false })
  @IsOptional()
  @IsString({ message: 'txHash harus berupa string' })
  txHash?: string;
}

export class TransferExecutionLogDto {
  @ApiProperty({ description: 'Aksi', example: 'ESCROW_RELEASE' })
  @IsString({ message: 'action harus berupa string' })
  action: string;

  @ApiProperty({ description: 'Status', example: 'SUCCESS' })
  @IsString({ message: 'status harus berupa string' })
  status: string;

  @ApiProperty({ description: 'Pesan', example: 'Escrow dilepas' })
  @IsString({ message: 'message harus berupa string' })
  message: string;

  @ApiProperty({ description: 'Tx hash', required: false })
  @IsOptional()
  @IsString({ message: 'txHash harus berupa string' })
  txHash?: string;

  @ApiProperty({ description: 'Waktu', example: '2026-07-01T10:00:00Z' })
  @IsString({ message: 'timestamp harus berupa string ISO date' })
  timestamp: string;
}

export class FinalRightsDto {
  @ApiProperty({ description: 'Hash perhitungan final' })
  @IsString({ message: 'calculationHash harus berupa string' })
  calculationHash: string;

  @ApiProperty({ description: 'Bagian investor', example: 7000000000 })
  @IsNumber({}, { message: 'finalShareInvestor harus berupa angka' })
  finalShareInvestor: number;

  @ApiProperty({ description: 'Bagian operator', example: 3000000000 })
  @IsNumber({}, { message: 'finalShareOperator harus berupa angka' })
  finalShareOperator: number;

  @ApiProperty({ description: 'Biaya', example: 150000000 })
  @IsNumber({}, { message: 'fees harus berupa angka' })
  fees: number;

  @ApiProperty({ description: 'Penalti', example: 50000000 })
  @IsNumber({}, { message: 'penalties harus berupa angka' })
  penalties: number;

  @ApiProperty({ description: 'Mata uang', example: 'IDR' })
  @IsString({ message: 'currency harus berupa string' })
  currency: string;

  @ApiProperty({ description: 'Status transaksi', enum: TxStatus })
  @IsEnum(TxStatus, { message: 'txStatus tidak valid' })
  txStatus: TxStatus;
}

export class DistributionStatusDto {
  @ApiProperty({ description: 'State menunggu', enum: DistributionWaitingState })
  @IsEnum(DistributionWaitingState, { message: 'waitingState tidak valid' })
  waitingState: DistributionWaitingState;

  @ApiProperty({ description: 'Hak final', type: FinalRightsDto })
  @ValidateNested()
  @Type(() => FinalRightsDto)
  finalRights: FinalRightsDto;

  @ApiProperty({ description: 'Instruksi distribusi', type: [DistributionInstructionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistributionInstructionDto)
  instructions: DistributionInstructionDto[];

  @ApiProperty({ description: 'Jejak eksekusi', type: [TransferExecutionLogDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferExecutionLogDto)
  logs: TransferExecutionLogDto[];
 }

export class DistributionResponseDto<T = any> {
  @ApiProperty({ description: 'Berhasil atau tidak', example: true })
  success: boolean;

  @ApiProperty({ description: 'Pesan', example: 'Distribusi siap dieksekusi' })
  message: string;

  @ApiProperty({ description: 'Data' })
  data: T;

  @ApiProperty({ description: 'Error jika ada', required: false })
  error?: string | null;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;
}
