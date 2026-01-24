import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums
export enum ReportStatus {
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
}

export enum OperationWaitingState {
  WAITING_FOR_REPORT = 'WAITING_FOR_REPORT',
  WAITING_FOR_VERIFICATION = 'WAITING_FOR_VERIFICATION',
  WAITING_FOR_MILESTONE_COMPLETION = 'WAITING_FOR_MILESTONE_COMPLETION',
}

export enum VerificationResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  PENDING = 'PENDING',
}

// Start Operation
export class StartOperationDto {
  @ApiProperty({
    example: 'contract-12345',
    description: 'ID Kontrak',
  })
  @IsNotEmpty({ message: 'ID Kontrak tidak boleh kosong' })
  @IsString()
  contractId: string;

  @ApiProperty({
    example: true,
    description: 'Konfirmasi eksplisit untuk memulai operasi',
  })
  @IsNotEmpty({ message: 'Konfirmasi operasi diperlukan' })
  @IsBoolean()
  confirmOperationStart: boolean;

  @ApiProperty({
    example: '2026-02-01T08:00:00Z',
    description: 'Waktu mulai operasi yang dijadwalkan',
  })
  @IsNotEmpty({ message: 'Waktu mulai diperlukan' })
  @IsDateString()
  scheduledStartTime: string;
}

// Milestone Item
export class MilestoneItemDto {
  @ApiProperty({
    example: 1,
    description: 'Nomor Milestone',
  })
  @IsNotEmpty()
  @IsNumber()
  milestoneNumber: number;

  @ApiProperty({
    example: 'Penyiapan Lokasi & Material',
    description: 'Deskripsi Milestone',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 33.33,
    description: 'Persentase dari kontrak',
  })
  @IsNotEmpty()
  @IsNumber()
  percentageOfContract: number;

  @ApiProperty({
    example: '2026-02-15',
    description: 'Tanggal target penyelesaian',
  })
  @IsNotEmpty()
  @IsDateString()
  targetCompletionDate: string;

  @ApiProperty({
    example: 'IDR 3.33 Miliar',
    description: 'Nilai milestone',
  })
  @IsNotEmpty()
  @IsString()
  amount: string;

  @ApiProperty({
    example: 'Contractor',
    description: 'Pihak bertanggung jawab',
  })
  @IsNotEmpty()
  @IsString()
  responsibleParty: string;

  @ApiProperty({
    example: ['Deliverable 1', 'Deliverable 2'],
    description: 'Daftar deliverable',
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  deliverables: string[];

  @ApiProperty({
    example: 'PENDING',
    description: 'Status milestone',
  })
  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status: ReportStatus;
}

// Operation State
export class OperationStateDto {
  @ApiProperty({
    example: 'OPERATION_RUNNING',
    description: 'Status operasi saat ini',
  })
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: 'WAITING_FOR_REPORT',
    description: 'Sub-status operasi',
  })
  @IsNotEmpty()
  @IsEnum(OperationWaitingState)
  waitingState: OperationWaitingState;

  @ApiProperty({
    example: 1,
    description: 'Milestone aktif saat ini',
  })
  @IsNotEmpty()
  @IsNumber()
  activeMilestoneNumber: number;

  @ApiProperty({
    example: 15,
    description: 'Hari sejak operasi dimulai',
  })
  @IsNotEmpty()
  @IsNumber()
  daysSinceStart: number;

  @ApiProperty({
    example: 45,
    description: 'Hari sampai deadline milestone',
  })
  @IsNotEmpty()
  @IsNumber()
  daysUntilDeadline: number;

  @ApiProperty({
    type: [MilestoneItemDto],
    description: 'Daftar milestone',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneItemDto)
  milestones: MilestoneItemDto[];

  @ApiProperty({
    example: 'Contractor',
    description: 'Pihak yang saat ini bertanggung jawab',
  })
  @IsNotEmpty()
  @IsString()
  currentResponsibleParty: string;

  @ApiProperty({
    example: 'Contractor harus menyerahkan laporan kemajuan',
    description: 'Apa yang sedang ditunggu',
  })
  @IsNotEmpty()
  @IsString()
  waitingFor: string;

  @ApiProperty({
    example: '2026-02-15T17:00:00Z',
    description: 'Deadline saat ini',
  })
  @IsNotEmpty()
  @IsDateString()
  currentDeadline: string;

  @ApiProperty({
    example: false,
    description: 'Apakah sudah melewati deadline',
  })
  @IsNotEmpty()
  @IsBoolean()
  isOverdue: boolean;

  @ApiProperty({
    example: 0,
    description: 'Jumlah hari terlambat',
  })
  @IsNotEmpty()
  @IsNumber()
  daysOverdue: number;

  @ApiProperty({
    example: 33.33,
    description: 'Persentase progres keseluruhan',
  })
  @IsNotEmpty()
  @IsNumber()
  overallProgress: number;
}

// Submit Report
export class SubmitReportDto {
  @ApiProperty({
    example: 'contract-12345',
    description: 'ID Kontrak',
  })
  @IsNotEmpty({ message: 'ID Kontrak tidak boleh kosong' })
  @IsString()
  contractId: string;

  @ApiProperty({
    example: 1,
    description: 'Nomor Milestone',
  })
  @IsNotEmpty({ message: 'Nomor Milestone diperlukan' })
  @IsNumber()
  milestoneNumber: number;

  @ApiProperty({
    example: 'Penyiapan lokasi telah selesai 80%, material sudah tiba',
    description: 'Deskripsi kemajuan',
  })
  @IsNotEmpty({ message: 'Deskripsi kemajuan diperlukan' })
  @IsString()
  progressDescription: string;

  @ApiProperty({
    example: 85,
    description: 'Persentase penyelesaian milestone (0-100)',
  })
  @IsNotEmpty({ message: 'Persentase penyelesaian diperlukan' })
  @IsNumber()
  completionPercentage: number;

  @ApiProperty({
    example: ['Photo 1', 'Photo 2', 'Photo 3'],
    description: 'Foto bukti kemajuan',
  })
  @IsNotEmpty({ message: 'Minimal satu bukti foto diperlukan' })
  @IsArray()
  @ArrayMinSize(1)
  photoUrls: string[];

  @ApiProperty({
    example: 'Tidak ada masalah',
    description: 'Catatan atau hambatan',
  })
  @IsString()
  notes?: string;

  @ApiProperty({
    example: '0x1234567890abcdef',
    description: 'Hash laporan untuk blockchain',
  })
  @IsString()
  reportHash?: string;
}

// Progress Report
export class ProgressReportDto {
  @ApiProperty({
    example: 'report-001',
    description: 'ID Laporan',
  })
  reportId: string;

  @ApiProperty({
    example: 1,
    description: 'Nomor Milestone',
  })
  milestoneNumber: number;

  @ApiProperty({
    example: '2026-02-10T14:30:00Z',
    description: 'Tanggal penyerahan laporan',
  })
  submittedDate: Date;

  @ApiProperty({
    example: 'Contractor',
    description: 'Pihak yang menyerahkan',
  })
  submittedBy: string;

  @ApiProperty({
    example: 'Penyiapan lokasi telah selesai 80%',
    description: 'Deskripsi kemajuan',
  })
  progressDescription: string;

  @ApiProperty({
    example: 85,
    description: 'Persentase penyelesaian',
  })
  completionPercentage: number;

  @ApiProperty({
    example: 'VERIFIED',
    description: 'Status laporan',
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({
    example: 'Laporan diterima dan telah diverifikasi',
    description: 'Catatan verifikasi',
  })
  verificationNotes: string;

  @ApiProperty({
    example: 'ProjectOwner',
    description: 'Pihak yang memverifikasi',
  })
  verifiedBy: string;

  @ApiProperty({
    example: '2026-02-11T10:00:00Z',
    description: 'Tanggal verifikasi',
  })
  verifiedDate: Date;
}

// Verify Report
export class VerifyReportDto {
  @ApiProperty({
    example: 'contract-12345',
    description: 'ID Kontrak',
  })
  @IsNotEmpty({ message: 'ID Kontrak tidak boleh kosong' })
  @IsString()
  contractId: string;

  @ApiProperty({
    example: 1,
    description: 'Nomor Milestone',
  })
  @IsNotEmpty({ message: 'Nomor Milestone diperlukan' })
  @IsNumber()
  milestoneNumber: number;

  @ApiProperty({
    example: 'APPROVED',
    description: 'Hasil verifikasi',
  })
  @IsNotEmpty({ message: 'Hasil verifikasi diperlukan' })
  @IsEnum(VerificationResult)
  result: VerificationResult;

  @ApiProperty({
    example: 'Pekerjaan memenuhi standar yang disyaratkan',
    description: 'Catatan verifikasi',
  })
  @IsNotEmpty({ message: 'Catatan verifikasi diperlukan' })
  @IsString()
  verificationNotes: string;

  @ApiProperty({
    example: ['Issue 1', 'Issue 2'],
    description: 'Daftar masalah ditemukan (jika ditolak)',
  })
  @IsArray()
  foundIssues?: string[];
}

// Activity Timeline Item
export class ActivityTimelineItemDto {
  @ApiProperty({
    example: 'report-submitted',
    description: 'Tipe aktivitas',
  })
  activityType: string;

  @ApiProperty({
    example: 'Laporan Milestone 1 Dikirim',
    description: 'Deskripsi aktivitas',
  })
  description: string;

  @ApiProperty({
    example: '2026-02-10T14:30:00Z',
    description: 'Tanggal aktivitas',
  })
  timestamp: Date;

  @ApiProperty({
    example: 'Contractor',
    description: 'Pihak yang melakukan',
  })
  actor: string;

  @ApiProperty({
    example: 'Mengacu pada Milestone 1',
    description: 'Referensi tambahan',
  })
  reference: string;

  @ApiProperty({
    example: 'success',
    description: 'Status aktivitas',
  })
  status: 'success' | 'warning' | 'error';
}

// Get Progress
export class GetProgressDto {
  @ApiProperty({
    type: OperationStateDto,
    description: 'Status operasi saat ini',
  })
  operationState: OperationStateDto;

  @ApiProperty({
    type: [ProgressReportDto],
    description: 'Daftar laporan yang telah dikirim',
  })
  submittedReports: ProgressReportDto[];

  @ApiProperty({
    type: [ActivityTimelineItemDto],
    description: 'Timeline aktivitas',
  })
  activityTimeline: ActivityTimelineItemDto[];

  @ApiProperty({
    example: {
      total: 3,
      completed: 1,
      pending: 1,
      inReview: 1,
    },
    description: 'Ringkasan milestone',
  })
  milestoneSummary: {
    total: number;
    completed: number;
    pending: number;
    inReview: number;
  };
}

// Response DTOs
export class OperationResponseDto<T> {
  @ApiProperty({
    example: true,
    description: 'Apakah request berhasil',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operasi berhasil dimulai',
    description: 'Pesan response (Indonesian)',
  })
  message: string;

  @ApiProperty({
    description: 'Data response',
  })
  data: T;

  @ApiProperty({
    example: null,
    description: 'Error jika ada',
  })
  error: string | null;

  @ApiProperty({
    description: 'Timestamp response',
  })
  timestamp: Date;
}

export class OperationStateResponseDto extends OperationResponseDto<OperationStateDto> {}

export class ProgressResponseDto extends OperationResponseDto<GetProgressDto> {}

export class SubmitReportResponseDto extends OperationResponseDto<ProgressReportDto> {}

export class VerifyReportResponseDto extends OperationResponseDto<ProgressReportDto> {}
