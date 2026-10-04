import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Email o username. */
  @IsString()
  @MinLength(3)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
