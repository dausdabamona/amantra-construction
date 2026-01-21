import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EvidenceService } from './evidence.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EvidenceType } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('evidence')
@Controller('evidence')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file bukti' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: Object.values(EvidenceType) },
        description: { type: 'string' },
        contractId: { type: 'string' },
        progressReportId: { type: 'string' },
        verificationId: { type: 'string' },
        capturedAt: { type: 'string' },
        location: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/evidence',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiResponse({ status: 201, description: 'File berhasil diupload' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: EvidenceType,
    @Body('description') description: string,
    @Body('contractId') contractId: string,
    @Body('progressReportId') progressReportId: string,
    @Body('verificationId') verificationId: string,
    @Body('capturedAt') capturedAt: string,
    @Body('location') location: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const fileBuffer = require('fs').readFileSync(file.path);

    return this.evidenceService.upload(
      {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        type,
        description,
        capturedAt,
        location,
        contractId: contractId || undefined,
        progressReportId: progressReportId || undefined,
        verificationId: verificationId || undefined,
      },
      fileBuffer,
      user,
    );
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Daftar bukti untuk kontrak' })
  @ApiResponse({ status: 200, description: 'Daftar file bukti' })
  async findByContract(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.evidenceService.findByContract(contractId);
  }

  @Get('progress-report/:progressReportId')
  @ApiOperation({ summary: 'Daftar bukti untuk laporan progres' })
  @ApiResponse({ status: 200, description: 'Daftar file bukti' })
  async findByProgressReport(
    @Param('progressReportId', ParseUUIDPipe) progressReportId: string,
  ) {
    return this.evidenceService.findByProgressReport(progressReportId);
  }

  @Get('verification/:verificationId')
  @ApiOperation({ summary: 'Daftar bukti untuk verifikasi' })
  @ApiResponse({ status: 200, description: 'Daftar file bukti' })
  async findByVerification(
    @Param('verificationId', ParseUUIDPipe) verificationId: string,
  ) {
    return this.evidenceService.findByVerification(verificationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail file bukti' })
  @ApiResponse({ status: 200, description: 'Detail file bukti' })
  @ApiResponse({ status: 404, description: 'File tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.evidenceService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus file bukti (soft delete)' })
  @ApiResponse({ status: 200, description: 'File berhasil dihapus' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.softDelete(id, user);
  }
}
