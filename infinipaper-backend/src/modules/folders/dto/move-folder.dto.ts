import { IsString } from 'class-validator';

export class MoveFolderDto {
  @IsString()
  parentId!: string;
}
