/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email:          string

    @IsString()
    // @MinLength(4)
    // @MaxLength(20)
    @IsNotEmpty()
    // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
    password:       string
}