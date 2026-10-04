import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTranscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class SaveNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000_000)
  content?: string;
}
