import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class RatingDto {

    @IsNotEmpty({message: 'Rating cannot be empty'})
    @IsInt()
    rating:                     number
 
    @IsNotEmpty({message: 'Remark cannot be empty'})
    @IsString({message: 'Remark must be a string'})
    @MaxLength(500)
    remark:                      string

    @IsNotEmpty({message: 'Material cannot be empty'})
    @IsInt()
    @IsOptional()
    material_id?:                number

    @IsNotEmpty({message: 'Channel cannot be empty'})
    @IsInt()
    @IsOptional()
    channel_id?:                 number
}

