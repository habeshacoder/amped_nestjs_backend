import { IsOptional, IsString } from 'class-validator';

export class SearchDto {
  @IsOptional()
  @IsString({ message: 'Search Key must be a string' })
  key: string;
}
