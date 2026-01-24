import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseContractDto {
  @ApiProperty({ description: 'Konfirmasi penutupan dan arsip kontrak', example: true })
  @IsBoolean({ message: 'confirm harus berupa boolean' })
  confirm: boolean;

  @ApiProperty({ description: 'Hash final untuk arsip immutable', required: false })
  @IsOptional()
  @IsString({ message: 'finalHash harus berupa string' })
  finalHash?: string;

  @ApiProperty({ description: 'Catatan penutupan', required: false })
  @IsOptional()
  @IsString({ message: 'notes harus berupa string' })
  notes?: string;

  @ApiProperty({ description: 'Judul laporan akhir', required: false })
  @IsOptional()
  @IsString({ message: 'finalReportTitle harus berupa string' })
  finalReportTitle?: string;

  @ApiProperty({ description: 'Ringkasan laporan akhir', required: false })
  @IsOptional()
  @IsString({ message: 'finalReportSummary harus berupa string' })
  finalReportSummary?: string;

  @ApiProperty({ description: 'Total dana yang diproses', required: false, example: 10000000000 })
  @IsOptional()
  @IsNumber({}, { message: 'totalFunds harus berupa angka' })
  totalFunds?: number;

  @ApiProperty({ description: 'Hasil akhir kontrak', required: false })
  @IsOptional()
  @IsString({ message: 'totalResult harus berupa string' })
  totalResult?: string;

  @ApiProperty({ description: 'Durasi pelaksanaan (hari)', required: false, example: 180 })
  @IsOptional()
  @IsNumber({}, { message: 'durationDays harus berupa angka' })
  durationDays?: number;

  @ApiProperty({ description: 'URL dokumen laporan akhir', required: false })
  @IsOptional()
  @IsString({ message: 'documentUrl harus berupa string' })
  documentUrl?: string;
}

export class FinalReportDto {
  @ApiProperty({ description: 'Judul laporan akhir', example: 'Final Completion Report' })
  title: string;

  @ApiProperty({ description: 'Ringkasan hasil', required: false })
  summary?: string;

  @ApiProperty({ description: 'Total dana yang diproses', required: false })
  totalFunds?: number;

  @ApiProperty({ description: 'Hasil akhir', required: false })
  totalResult?: string;

  @ApiProperty({ description: 'Durasi dalam hari', required: false })
  durationDays?: number;

  @ApiProperty({ description: 'URL dokumen', required: false })
  documentUrl?: string;

  @ApiProperty({ description: 'Waktu dibuat' })
  createdAt: string;
}

export class AuditTrailItemDto {
  @ApiProperty({ description: 'Jenis aksi', example: 'DISTRIBUTION_COMPLETED' })
  action: string;

  @ApiProperty({ description: 'Pesan ringkas' })
  message: string;

  @ApiProperty({ description: 'Pelaku', required: false })
  actorId?: string;

  @ApiProperty({ description: 'Hash transaksi terkait', required: false })
  txHash?: string;

  @ApiProperty({ description: 'Waktu tercatat' })
  timestamp: string;
}

export class ArchiveSnapshotDto {
  @ApiProperty({ description: 'ID kontrak' })
  contractId: string;

  @ApiProperty({ description: 'State final' })
  finalState: string;

  @ApiProperty({ description: 'Hash final', required: false })
  finalHash?: string;

  @ApiProperty({ description: 'Snapshot hak final' })
  finalRightsSnapshot: any;

  @ApiProperty({ description: 'Daftar hash transaksi' })
  transactionHashes: string[];

  @ApiProperty({ description: 'Log transisi state' })
  transitionLog: any[];

  @ApiProperty({ description: 'Timestamps fase utama' })
  phaseTimestamps: Record<string, string | null>;

  @ApiProperty({ description: 'Distribusi selesai?' })
  distributionCompleted: boolean;

  @ApiProperty({ description: 'Dicatat oleh', required: false })
  closedBy?: string;

  @ApiProperty({ description: 'Waktu arsip' })
  archivedAt: string;

  @ApiProperty({ description: 'Catatan', required: false })
  notes?: string;

  @ApiProperty({ description: 'Laporan akhir', required: false, type: () => FinalReportDto })
  finalReport?: FinalReportDto;

  @ApiProperty({ description: 'Jejak audit akhir', type: [AuditTrailItemDto] })
  auditTrail: AuditTrailItemDto[];
}

export class ArchiveResponseDto<T> {
  @ApiProperty({ description: 'Berhasil atau tidak' })
  success: boolean;

  @ApiProperty({ description: 'Pesan' })
  message: string;

  @ApiProperty({ description: 'Data' })
  data: T;

  @ApiProperty({ description: 'Error jika ada', required: false })
  error: string | null;

  @ApiProperty({ description: 'Timestamp respon' })
  timestamp: Date;
}
