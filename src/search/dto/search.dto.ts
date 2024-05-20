import {
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Parent, Type, Genere, Catagory } from '@prisma/client';

export class SearchDto {
  @IsOptional()
  @IsString({ message: 'Search Key must be a string' })
  key: string;

  @IsString({ message: 'Type must be a string' })
  @IsOptional()
  @IsIn([
    'Audiobook',
    'Book',
    'Magazine',
    'Newspaper',
    'Podcast',
    'Drama',
    'Unspecified',
    'All',
  ])
  type: Type;

  @IsOptional()
  @IsDate({ message: 'Time from must be a date' })
  time_from: Date;

  @IsOptional()
  @IsDate({ message: 'Time to must be a date' })
  time_to: Date;
}
