/* eslint-disable prettier/prettier */
import { Sex } from "@prisma/client"
import { IsNotEmpty, IsString, IsIn } from "class-validator"

export class SellerProfileDto {

    @IsNotEmpty({message: 'Name cannot be empty'})
    @IsString({message: 'Name must be a string'})
    name:               string

    @IsString({message: 'Description must be a string'})
    description:        string

    @IsString({message: 'Sex must be a string'})
    @IsIn(['Male', 'Female', 'Unspecified'])
    sex:                Sex

    @IsString({message: 'Birth date must be a string'})
    date_of_birth:      string
}

