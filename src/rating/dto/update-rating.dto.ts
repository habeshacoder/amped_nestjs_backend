import { IsInt, IsNotEmpty, IsString, MaxLength, maxLength } from "class-validator"

export class UpdateRatingDto {

    @IsNotEmpty({message: 'Rating cannot be empty'})
    @IsInt()
    rating:                     number

    @IsNotEmpty({message: 'Remark cannot be empty'})
    @IsString({message: 'Remark must be a string'})
    @MaxLength(100)
    remark:                      string
}

