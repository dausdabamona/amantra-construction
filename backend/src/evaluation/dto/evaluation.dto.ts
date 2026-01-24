import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EvaluationWaitingState {
  WAITING_FOR_AUDIT = 'WAITING_FOR_AUDIT',
  WAITING_FOR_CORRECTION = 'WAITING_FOR_CORRECTION',
  WAITING_FOR_FINAL_APPROVAL = 'WAITING_FOR_FINAL_APPROVAL',
}

export enum CalculationLineType {
  BASE_VALUE = 'BASE_VALUE',
  DEDUCTION = 'DEDUCTION',
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

export enum ObjectionStatusType {
  NONE = 'NONE',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
}

export class StartEvaluationDto {
  @ApiProperty({ description: 'ID kontrak', example: 'contract-001' })
  @IsString({ message: 'contractId harus berupa string' })
  @IsNotEmpty({ message: 'contractId tidak boleh kosong' })
  contractId: string;

  @ApiProperty({ description: 'Konfirmasi memulai evaluasi', example: true })
  @IsBoolean({ message: 'confirmStart harus bernilai boolean' })
  confirmStart: boolean;

  @ApiProperty({ description: 'Catatan tambahan untuk evaluator', required: false })
  @IsOptional()
  @IsString({ message: 'evaluationNotes harus berupa string' })
  evaluationNotes?: string;
}

export class ManualAdjustmentDto {
  @ApiProperty({ description: 'Label penyesuaian', example: 'Penalty keterlambatan' })
  @IsString({ message: 'label harus berupa string' })
  @IsNotEmpty({ message: 'label tidak boleh kosong' })
  label: string;

  @ApiProperty({ description: 'Nilai penyesuaian', example: -25000000 })
  @IsNumber({}, { message: 'amount harus berupa angka' })
  amount: number;

  @ApiProperty({
    description: 'Jenis penyesuaian',
    enum: CalculationLineType,
    example: CalculationLineType.PENALTY,
  })
  @IsEnum(CalculationLineType, { message: 'type harus salah satu dari CalculationLineType' })
  type: CalculationLineType;

  @ApiProperty({ description: 'Deskripsi penyesuaian', required: false })
  @IsOptional()
  @IsString({ message: 'description harus berupa string' })
  description?: string;
}

export class CalculationRequestDto {
  @ApiProperty({ description: 'ID kontrak', example: 'contract-001' })
  @IsString({ message: 'contractId harus berupa string' })
  @IsNotEmpty({ message: 'contractId tidak boleh kosong' })
  contractId: string;

  @ApiProperty({ description: 'Terapkan penyesuaian risiko', default: true })
  @IsOptional()
  @IsBoolean({ message: 'applyRiskAdjustments harus berupa boolean' })
  applyRiskAdjustments?: boolean;

  @ApiProperty({ description: 'Penyesuaian manual tambahan', type: [ManualAdjustmentDto], required: false })
  @IsOptional()
  @IsArray({ message: 'manualAdjustments harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => ManualAdjustmentDto)
  manualAdjustments?: ManualAdjustmentDto[];
}

export class ObjectionDto {
  @ApiProperty({ description: 'ID kontrak', example: 'contract-001' })
  @IsString({ message: 'contractId harus berupa string' })
  @IsNotEmpty({ message: 'contractId tidak boleh kosong' })
  contractId: string;

  @ApiProperty({ description: 'Alasan keberatan', example: 'Perhitungan denda tidak sesuai' })
  @IsString({ message: 'reason harus berupa string' })
  @IsNotEmpty({ message: 'reason tidak boleh kosong' })
  reason: string;

  @ApiProperty({ description: 'Perubahan yang diminta', example: 'Kurangi denda keterlambatan menjadi 5%' })
  @IsString({ message: 'requestedChanges harus berupa string' })
  @IsNotEmpty({ message: 'requestedChanges tidak boleh kosong' })
  requestedChanges: string;

  @ApiProperty({ description: 'Bukti pendukung', type: [String], required: false })
  @IsOptional()
  @IsArray({ message: 'evidenceUrls harus berupa array string' })
  @IsString({ each: true, message: 'evidenceUrls harus berupa string' })
  evidenceUrls?: string[];
}

export class VerifiedPerformanceItemDto {
  @ApiProperty({ description: 'Nomor milestone', example: 1 })
  @IsNumber({}, { message: 'milestoneNumber harus berupa angka' })
  milestoneNumber: number;

  @ApiProperty({ description: 'Nilai rencana', example: 3300000000 })
  @IsNumber({}, { message: 'plannedValue harus berupa angka' })
  plannedValue: number;

  @ApiProperty({ description: 'Nilai aktual', example: 3300000000 })
  @IsNumber({}, { message: 'actualValue harus berupa angka' })
  actualValue: number;

  @ApiProperty({ description: 'Deviasi', example: 0 })
  @IsNumber({}, { message: 'deviation harus berupa angka' })
  deviation: number;

  @ApiProperty({ description: 'Satuan', example: 'IDR' })
  @IsString({ message: 'unit harus berupa string' })
  unit: string;

  @ApiProperty({ description: 'Bukti verifikasi', type: [String] })
  @IsArray({ message: 'evidenceLinks harus berupa array string' })
  @IsString({ each: true, message: 'evidenceLinks harus berupa string' })
  evidenceLinks: string[];

  @ApiProperty({ description: 'Diverifikasi oleh', example: 'ProjectOwner' })
  @IsString({ message: 'verifiedBy harus berupa string' })
  verifiedBy: string;

  @ApiProperty({ description: 'Tanggal verifikasi', example: '2026-06-20T12:00:00Z' })
  @IsString({ message: 'verifiedAt harus berupa string ISO date' })
  verifiedAt: string;
}

export class ClauseReferenceDto {
  @ApiProperty({ description: 'ID klausul', example: 'CL-4.2' })
  @IsString({ message: 'clauseId harus berupa string' })
  clauseId: string;

  @ApiProperty({ description: 'Judul klausul', example: 'Keterlambatan dan Denda' })
  @IsString({ message: 'title harus berupa string' })
  title: string;

  @ApiProperty({ description: 'Deskripsi klausul', example: 'Denda 1% per minggu keterlambatan' })
  @IsString({ message: 'description harus berupa string' })
  description: string;

  @ApiProperty({ description: 'Alasan diterapkan', example: 'Milestone 2 terlambat 7 hari' })
  @IsString({ message: 'appliedReason harus berupa string' })
  appliedReason: string;

  @ApiProperty({ description: 'Dampak', example: 'Pengurangan 7% dari nilai termin' })
  @IsString({ message: 'impact harus berupa string' })
  impact: string;
}

export class CalculationLineItemDto {
  @ApiProperty({ description: 'Label item', example: 'Nilai kontrak' })
  @IsString({ message: 'label harus berupa string' })
  label: string;

  @ApiProperty({ description: 'Jumlah', example: 10000000000 })
  @IsNumber({}, { message: 'amount harus berupa angka' })
  amount: number;

  @ApiProperty({ description: 'Jenis item', enum: CalculationLineType })
  @IsEnum(CalculationLineType, { message: 'type harus salah satu dari CalculationLineType' })
  type: CalculationLineType;

  @ApiProperty({ description: 'Deskripsi', example: 'Nilai kontrak awal' })
  @IsString({ message: 'description harus berupa string' })
  description: string;

  @ApiProperty({ description: 'Dampak terhadap pembayaran', example: 'Menambah basis perhitungan' })
  @IsString({ message: 'impactOnPayment harus berupa string' })
  impactOnPayment: string;
}

export class ProvisionalResultDto {
  @ApiProperty({ description: 'Total dasar yang dapat dibayarkan', example: 10000000000 })
  @IsNumber({}, { message: 'grossPayable harus berupa angka' })
  grossPayable: number;

  @ApiProperty({ description: 'Total pengurangan', example: 700000000 })
  @IsNumber({}, { message: 'totalDeductions harus berupa angka' })
  totalDeductions: number;

  @ApiProperty({ description: 'Total bonus', example: 150000000 })
  @IsNumber({}, { message: 'totalBonuses harus berupa angka' })
  totalBonuses: number;

  @ApiProperty({ description: 'Pembayaran bersih (provisional)', example: 9449999999 })
  @IsNumber({}, { message: 'netPayable harus berupa angka' })
  netPayable: number;

  @ApiProperty({ description: 'Mata uang', example: 'IDR' })
  @IsString({ message: 'currency harus berupa string' })
  currency: string;

  @ApiProperty({ description: 'Apakah final?', example: false })
  @IsBoolean({ message: 'isFinal harus berupa boolean' })
  isFinal: boolean;
}

export class ObjectionStatusDto {
  @ApiProperty({ description: 'Status keberatan', enum: ObjectionStatusType })
  @IsEnum(ObjectionStatusType, { message: 'status harus salah satu dari ObjectionStatusType' })
  status: ObjectionStatusType;

  @ApiProperty({ description: 'Diajukan oleh', example: 'Contractor' })
  @IsOptional()
  @IsString({ message: 'submittedBy harus berupa string' })
  submittedBy?: string;

  @ApiProperty({ description: 'Waktu diajukan', example: '2026-06-22T10:00:00Z' })
  @IsOptional()
  @IsString({ message: 'submittedAt harus berupa string ISO date' })
  submittedAt?: string;

  @ApiProperty({ description: 'Catatan penyelesaian', required: false })
  @IsOptional()
  @IsString({ message: 'resolutionNotes harus berupa string' })
  resolutionNotes?: string;

  @ApiProperty({ description: 'Batas waktu penyelesaian', example: '2026-06-30T23:59:59Z' })
  @IsOptional()
  @IsString({ message: 'resolutionDeadline harus berupa string ISO date' })
  resolutionDeadline?: string;
}

export class AuditLogItemDto {
  @ApiProperty({ description: 'Jenis aktivitas', example: 'EVALUATION_STARTED' })
  @IsString({ message: 'action harus berupa string' })
  action: string;

  @ApiProperty({ description: 'Deskripsi', example: 'Evaluasi dimulai dan data dibekukan' })
  @IsString({ message: 'description harus berupa string' })
  description: string;

  @ApiProperty({ description: 'Waktu', example: '2026-06-20T12:00:00Z' })
  @IsString({ message: 'timestamp harus berupa string ISO date' })
  timestamp: string;

  @ApiProperty({ description: 'Aktor', example: 'ProjectOwner' })
  @IsString({ message: 'actor harus berupa string' })
  actor: string;
}

export class EvaluationDataDto {
  @ApiProperty({ description: 'Status utama kontrak', example: 'EVALUATION_AND_CALCULATION' })
  @IsString({ message: 'state harus berupa string' })
  state: string;

  @ApiProperty({ description: 'Status menunggu evaluasi', enum: EvaluationWaitingState })
  @IsEnum(EvaluationWaitingState, { message: 'waitingState harus salah satu dari EvaluationWaitingState' })
  waitingState: EvaluationWaitingState;

  @ApiProperty({ description: 'Apakah data dibekukan', example: true })
  @IsBoolean({ message: 'isDataFrozen harus berupa boolean' })
  isDataFrozen: boolean;

  @ApiProperty({ description: 'Data kinerja terverifikasi', type: [VerifiedPerformanceItemDto] })
  @IsArray({ message: 'verifiedPerformanceData harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => VerifiedPerformanceItemDto)
  verifiedPerformanceData: VerifiedPerformanceItemDto[];

  @ApiProperty({ description: 'Klausul kontrak yang diterapkan', type: [ClauseReferenceDto] })
  @IsArray({ message: 'appliedContractClauses harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => ClauseReferenceDto)
  appliedContractClauses: ClauseReferenceDto[];

  @ApiProperty({ description: 'Rincian perhitungan', type: [CalculationLineItemDto] })
  @IsArray({ message: 'calculationBreakdown harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => CalculationLineItemDto)
  calculationBreakdown: CalculationLineItemDto[];

  @ApiProperty({ description: 'Hasil provisional', type: ProvisionalResultDto })
  @ValidateNested()
  @Type(() => ProvisionalResultDto)
  provisionalResults: ProvisionalResultDto;

  @ApiProperty({ description: 'Status keberatan', type: ObjectionStatusDto })
  @ValidateNested()
  @Type(() => ObjectionStatusDto)
  objectionStatus: ObjectionStatusDto;

  @ApiProperty({ description: 'Jumlah putaran koreksi', example: 0 })
  @IsNumber({}, { message: 'correctionRounds harus berupa angka' })
  correctionRounds: number;

  @ApiProperty({ description: 'Batas waktu keberatan', example: '2026-06-28T23:59:59Z' })
  @IsString({ message: 'objectionDeadline harus berupa string ISO date' })
  objectionDeadline: string;

  @ApiProperty({ description: 'Batas waktu koreksi', example: '2026-07-05T23:59:59Z' })
  @IsString({ message: 'correctionDeadline harus berupa string ISO date' })
  correctionDeadline: string;

  @ApiProperty({ description: 'Menunggu tindakan', example: 'Menunggu audit final dari ProjectOwner' })
  @IsString({ message: 'waitingFor harus berupa string' })
  waitingFor: string;

  @ApiProperty({ description: 'Hash perhitungan (jika sudah disiapkan)', required: false })
  @IsOptional()
  @IsString({ message: 'calculationHash harus berupa string' })
  calculationHash?: string;

  @ApiProperty({ description: 'Jejak audit evaluasi', type: [AuditLogItemDto] })
  @IsArray({ message: 'auditTrail harus berupa array' })
  @ValidateNested({ each: true })
  @Type(() => AuditLogItemDto)
  auditTrail: AuditLogItemDto[];
}

export class CalculationResponseDto {
  @ApiProperty({ description: 'Status berhasil', example: true })
  success: boolean;

  @ApiProperty({ description: 'Pesan', example: 'Perhitungan berhasil dibuat' })
  message: string;

  @ApiProperty({ description: 'Data evaluasi setelah perhitungan', type: EvaluationDataDto })
  data: EvaluationDataDto;

  @ApiProperty({ description: 'Error jika ada', required: false })
  error?: string | null;

  @ApiProperty({ description: 'Timestamp', example: '2026-06-20T12:00:00Z' })
  timestamp: Date;
}

export class EvaluationResponseDto<T = any> {
  @ApiProperty({ description: 'Status berhasil', example: true })
  success: boolean;

  @ApiProperty({ description: 'Pesan', example: 'Berhasil' })
  message: string;

  @ApiProperty({ description: 'Payload data' })
  data: T;

  @ApiProperty({ description: 'Error jika ada', required: false })
  error?: string | null;

  @ApiProperty({ description: 'Timestamp', example: '2026-06-20T12:00:00Z' })
  timestamp: Date;
}
