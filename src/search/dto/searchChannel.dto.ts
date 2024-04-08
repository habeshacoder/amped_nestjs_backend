import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator"

export class SearchChannelDto {

    @IsOptional()
    @IsString({message: 'Search Key must be a string'})
    key:                        string

    @IsOptional()
    @IsDate({message: 'Time from must be a date'})
    time_from:                  Date

    @IsOptional()
    @IsDate({message: 'Time to must be a date'})
    time_to:                    Date

    // @IsNumber()
    // @MaxLength(200)
    // price_from:                 number

    // @IsNumber()
    // @MaxLength(200)
    // price_to:                   number
}