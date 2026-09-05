export class ReceiptNeedsTotalError extends Error {
  accessKey?: string;
  sourceUrl?: string;

  constructor(message: string, accessKey?: string, sourceUrl?: string) {
    super(message);
    this.name = "ReceiptNeedsTotalError";
    this.accessKey = accessKey;
    this.sourceUrl = sourceUrl;
  }
}
