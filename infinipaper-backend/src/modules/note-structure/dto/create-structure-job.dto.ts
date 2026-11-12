import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStructureJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}
