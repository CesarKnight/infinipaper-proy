import { IsString, MaxLength } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @MaxLength(1_000_000)
  content!: string;
}
