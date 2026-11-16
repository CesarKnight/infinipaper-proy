import { IsString, MinLength } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  @MinLength(10)
  token!: string;
}
