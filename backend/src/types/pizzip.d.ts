declare module 'pizzip' {
  interface GenerateOptions {
    type: 'nodebuffer' | 'uint8array' | 'blob' | 'base64' | 'string';
    compression?: 'STORE' | 'DEFLATE';
  }

  export default class PizZip {
    constructor(data?: Buffer | Uint8Array | ArrayBuffer | string);
    generate(options: { type: 'nodebuffer'; compression?: 'STORE' | 'DEFLATE' }): Buffer;
    generate(options: GenerateOptions): Buffer | Uint8Array | Blob | string;
  }
}
