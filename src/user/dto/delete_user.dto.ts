import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
