export class AppException extends Error {
  constructor(payload: string | unknown) {
    let message: string | null = null;
    if (typeof payload === "string") {
      message = payload;
    } else if (payload instanceof Error) {
      message = payload.message;
    }
    super(message ?? "An error occurred");
    this.name = "AppException";
  }
}
