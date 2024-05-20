/* eslint-disable prettier/prettier */
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Parent, Type, Genere, Catagory } from '@prisma/client';

export class MaterialDto {
  @IsString({ message: 'Parent must be a string' })
  @IsNotEmpty({ message: "Parent can't be empty" })
  @IsIn(['Publication', 'Audio', 'Unspecified'])
  parent: Parent;

  @IsString({ message: 'Type must be a string' })
  @IsNotEmpty({ message: "Type can't be empty" })
  @IsIn([
    'Audiobook',
    'Book',
    'Magazine',
    'Newspaper',
    'Podcast',
    'Drama',
    'Unspecified',
  ])
  type: Type;

  @IsString({ message: 'Genere must be a string' })
  @IsNotEmpty({ message: "Genere can't be empty" })
  @IsIn(['Psychology', 'Comedy', 'Unspecified'])
  genere: Genere;

  @IsString({ message: 'Catagory must be a string' })
  @IsNotEmpty({ message: "Catagory can't be empty" })
  @IsIn(['Fiction', 'Story', 'Documentary', 'Unspecified'])
  catagory: Catagory;

  @IsNotEmpty({ message: 'Title cannot be empty' })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNumber()
  price: number;

  @IsNotEmpty({ message: 'Seller cannot be empty' })
  @IsNumber()
  sellerProfile_id: number;

  @IsString({ message: 'Author must be a string' })
  author: string;

  @IsString({ message: 'Reader must be a string' })
  reader: string;

  @IsString({ message: 'Translator must be a string' })
  translator: string;

  @IsNumber()
  length_minute: number;

  @IsNumber()
  length_page: number;

  @IsString({ message: 'Language must be a string' })
  language: string;

  @IsString({ message: 'Publisher must be a string' })
  publisher: string;

  @IsNumber()
  episode: number;

  @IsNumber()
  continues_from: number;

  @IsNumber()
  first_published_at: number;
}
