import {  IsInt, IsNotEmpty, IsString } from "class-validator"

export class SubscribedUserDto {
    @IsInt()
    @IsNotEmpty()
    subscription_id:              number

    @IsString()
    @IsNotEmpty()
    name:                         string
}