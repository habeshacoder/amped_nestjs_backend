/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FavoriteDto {
  @IsNotEmpty({})
  @IsString()
  user_id: string;

  @IsOptional()
  @IsNumber()
  channel_id?: number;

  @IsOptional()
  @IsNumber()
  material_id?: number;
}
