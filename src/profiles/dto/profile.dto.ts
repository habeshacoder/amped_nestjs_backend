import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Sex } from '@prisma/client/';

export class ProfileDto {
  @IsNotEmpty({ message: 'First Name cannot be empty' })
  @IsString({ message: 'First Name must be a string' })
  first_name: string;

  @IsNotEmpty({ message: 'Last Name cannot be empty' })
  @IsString({ message: 'Last Name must be a string' })
  last_name: string;

  @IsString({ message: 'Sex must be a string' })
  @IsNotEmpty({ message: 'Sex cannot be empty' })
  @IsIn(['Male', 'Female', 'Unspecified'])
  sex: Sex;

  @IsNotEmpty({ message: 'Birth date cannot be empty' })
  @IsString({ message: 'Birth date must be a string' })
  date_of_birth: string;
}
