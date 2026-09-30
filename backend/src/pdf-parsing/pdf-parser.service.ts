import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

@Injectable()
export class PdfParserService {
  constructor(private readonly config: ConfigService) {}

  extractToMarkdown(pdf: Buffer): Promise<string> {
    if (pdf.length === 0 || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new BadRequestException('The uploaded file is not a valid PDF.');
    }

    const python = this.config.getOrThrow<string>('PDF_PYTHON_EXECUTABLE');
    const script = join(__dirname, 'extract_to_markdown.py');

    return new Promise((resolve, reject) => {
      const child = spawn(python, [script], {
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      const output: Buffer[] = [];
      const errors: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => output.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
      child.on('error', () => {
        reject(new ServiceUnavailableException(
          `Could not start the PDF parser. Install Python and pdfplumber, or set PDF_PYTHON_EXECUTABLE.`,
        ));
      });
      child.on('close', (code) => {
        const message = Buffer.concat(errors).toString('utf8').trim();
        if (code === 0) {
          const markdown = Buffer.concat(output).toString('utf8').trim();
          if (!markdown) {
            reject(new BadRequestException('No text or tables could be extracted from this PDF.'));
            return;
          }
          resolve(markdown);
          return;
        }

        if (code === 2) {
          reject(new BadRequestException(message || 'The PDF could not be parsed.'));
          return;
        }
        reject(new ServiceUnavailableException(message || 'The PDF parser failed.'));
      });

      child.stdin.on('error', () => undefined);
      child.stdin.end(pdf);
    });
  }
}
