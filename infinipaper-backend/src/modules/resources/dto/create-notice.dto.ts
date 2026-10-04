import { IsString, MaxLength } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @MaxLength(1_000_000)
  content!: string;
}
