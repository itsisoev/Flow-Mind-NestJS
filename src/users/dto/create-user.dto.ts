import { IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(3, { message: 'password must be more 3 symbols' })
  password: string;
}
