export class AppError extends Error {
  code: number;

  constructor(message: string, code?: number) {
    super(message);

    this.message = message;
    this.code = code || 400;
  }
}
