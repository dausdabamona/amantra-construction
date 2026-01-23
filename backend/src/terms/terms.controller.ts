import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';

@ApiTags('terms')
@Controller('terms')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TermsController {
  constructor(private termsService: TermsService) {}

  @Post('contract/:contractId')
  @ApiOperation({ summary: 'Buat termin baru untuk kontrak (Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Termin berhasil dibuat',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Owner yang bisa membuat termin',
  })
  async create(
    @Param('contractId') contractId: string,
    @Body() createTermDto: CreateTermDto,
    @Request() req: any,
  ) {
    return this.termsService.create(contractId, createTermDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan detail termin dengan progres dan verifikasi' })
  @ApiResponse({
    status: 200,
    description: 'Detail termin',
  })
  @ApiResponse({
    status: 404,
    description: 'Termin tidak ditemukan',
  })
  async findOne(@Param('id') id: string) {
    return this.termsService.findById(id);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Dapatkan semua termin untuk kontrak' })
  @ApiResponse({
    status: 200,
    description: 'Daftar termin',
  })
  async findByContract(@Param('contractId') contractId: string) {
    return this.termsService.findByContract(contractId);
  }
}
