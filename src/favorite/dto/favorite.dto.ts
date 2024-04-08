/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class FavoriteDto {
    @IsNotEmpty({})
    @IsString()
    user_id:                        string

    @IsOptional()
    channel_id?:                    number

    @IsOptional()
    material_id?:                   number
}
