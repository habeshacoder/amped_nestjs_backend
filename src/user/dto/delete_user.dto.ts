import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
