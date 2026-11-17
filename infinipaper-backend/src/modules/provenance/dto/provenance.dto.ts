import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateResourceDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  status!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
