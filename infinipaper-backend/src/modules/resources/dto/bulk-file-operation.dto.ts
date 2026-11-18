import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkFileOperationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  fileIds!: string[];
}
