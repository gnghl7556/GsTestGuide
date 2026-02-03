declare module 'mammoth' {
  export function extractRawText(options: {
    path?: string;
    buffer?: Buffer;
  }): Promise<{ value: string; messages: Array<{ message: string }> }>;

  export function convertToHtml(options: {
    path?: string;
    buffer?: Buffer;
  }): Promise<{ value: string; messages: Array<{ message: string }> }>;
}
