import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@Controller('progress')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post('term/:termId')
  @ApiOperation({ summary: 'Upload progress for a term (Contractor only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadProgress(
    @Param('termId') termId: string,
    @Body() body: { description: string; claimPercentage: string },
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.progressService.uploadProgress(
      termId,
      {
        description: body.description,
        claimPercentage: parseFloat(body.claimPercentage),
        photoUrl: file ? `/uploads/progress/${file.filename}` : undefined,
      },
      req.user,
    );
  }

  @Post('term/:termId/submit')
  @ApiOperation({ summary: 'Submit term for verification (Contractor only)' })
  async submitForVerification(@Param('termId') termId: string, @Request() req: any) {
    return this.progressService.submitForVerification(termId, req.user);
  }

  @Get('term/:termId')
  @ApiOperation({ summary: 'Get all progress for a term' })
  async findByTerm(@Param('termId') termId: string) {
    return this.progressService.findByTerm(termId);
  }
}
