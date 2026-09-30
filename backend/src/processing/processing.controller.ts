import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProcessingService } from './processing.service';

const MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024;

@Controller()
export class ProcessingController {
  constructor(private readonly processing: ProcessingService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PDF_UPLOAD_BYTES } }))
  uploadPdf(@UploadedFile() file?: Express.Multer.File): Promise<{ requestId: string }> {
    if (!file) {
      throw new BadRequestException('A PDF file is required in the "file" form field.');
    }
    return this.processing.submitPdf(file.buffer);
  }

  @Get('status/:requestId')
  getStatus(@Param('requestId', new ParseUUIDPipe({ version: '4' })) requestId: string) {
    return this.processing.getStatus(requestId);
  }

  @Get('preview/:requestId')
  getPreview(@Param('requestId', new ParseUUIDPipe({ version: '4' })) requestId: string) {
    return this.processing.getPreview(requestId);
  }

  @Get('download/:requestId/:fileType')
  async downloadFile(
    @Param('requestId', new ParseUUIDPipe({ version: '4' })) requestId: string,
    @Param('fileType') fileType: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename, contentType } = await this.processing.getDownloadFile(requestId, fileType);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @Get('download-all/:requestId')
  async downloadAll(
    @Param('requestId', new ParseUUIDPipe({ version: '4' })) requestId: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.processing.getDownloadAllZip(requestId);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="GA_Exporter_files.zip"',
    });
    res.send(buffer);
  }
}
