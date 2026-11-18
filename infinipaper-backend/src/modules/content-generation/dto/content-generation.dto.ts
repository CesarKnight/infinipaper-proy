import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerationSourceDto {
  @IsIn(['RESOURCE', 'FOLDER', 'PROJECT'])
  type!: 'RESOURCE' | 'FOLDER' | 'PROJECT';

  @IsString()
  id!: string;
}

export class CreateMindmapDto {
  @ValidateNested()
  @Type(() => GenerationSourceDto)
  source!: GenerationSourceDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}

export class CreateQuizGenerationDto {
  @ValidateNested()
  @Type(() => GenerationSourceDto)
  source!: GenerationSourceDto;

  @IsInt()
  @Min(5)
  @Max(30)
  count!: number;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty!: 'easy' | 'medium' | 'hard';

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'], { each: true })
  types!: Array<'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}

export class ListGenerationJobsDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
