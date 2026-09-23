import { AppError } from "@/lib/errors";

export class UploadError extends AppError {
  constructor(message: string) {
    super("UPLOAD_FAILED", message);
  }
}
