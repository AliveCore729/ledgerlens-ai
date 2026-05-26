import { IsOptional, IsString } from "class-validator";

export class UploadStatementDto {
  @IsOptional()
  @IsString()
  bankName?: string;
}