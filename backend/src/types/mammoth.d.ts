declare module 'mammoth' {
  export interface ConvertToHtmlInput {
    buffer: Buffer;
  }

  export interface ConvertMessage {
    type: string;
    message: string;
  }

  export interface ConvertToHtmlResult {
    value: string;
    messages: ConvertMessage[];
  }

  export function convertToHtml(input: ConvertToHtmlInput): Promise<ConvertToHtmlResult>;
}
