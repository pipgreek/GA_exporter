import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}
