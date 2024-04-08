import { IsBoolean, IsDate, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator"
import { Parent, Type, Genere, Catagory } from "@prisma/client"

export class SearchDto {

    @IsOptional()
    @IsString({message: 'Search Key must be a string'})
    key:                        string

    @IsString({message: 'Parent must be a string'})
    @IsOptional()
    @IsIn(['Publication', 'Audio', 'Unspecified'])
    parent:                 Parent

    @IsString({message: 'Type must be a string'})
    @IsOptional()
    @IsIn(["Audiobook", "Book", "Magazine", "Newspaper", "Podcast", "Drama", "Unspecified"])
    type:                   Type  
    
    @IsString({message: 'Genere must be a string'})
    @IsOptional()
    @IsIn(["Psycology", "Commedy", "Unspecified"])
    genere:                 Genere

    @IsString({message: 'Catagory must be a string'})
    @IsOptional()
    @IsIn(["Fiction", "Story", "Documentary", "Unspecified"])
    catagory:               Catagory

    // @IsOptional()
    // @IsString({message: 'Type must be a string'})
    // type:                       string

    @IsOptional()
    @IsDate({message: 'Time from must be a date'})
    time_from:                  Date

    @IsOptional()
    @IsDate({message: 'Time to must be a date'})
    time_to:                    Date

    // @IsOptional()
    // @IsString({message: 'Parent must be a string'})
    // parent:                     string

    // @IsOptional()
    // @IsString({message: 'Gener must be a string'})
    // genere:                     string

    // @IsOptional()
    // @IsString({message: 'Catagory must be a string'})
    // catagory:                   string

    @IsOptional()
    @IsNumber()
    price_from:                 number

    @IsOptional()
    @IsNumber()
    price_to:                   number

    // @IsBoolean({message: 'Channel Key must be a true or false'})
    // channel:                    boolean
}