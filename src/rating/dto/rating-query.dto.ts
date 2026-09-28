import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MaterialRatingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  material_id?: number;
}

export class ChannelRatingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  channel_id?: number;
}
