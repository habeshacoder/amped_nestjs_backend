import { IsNotEmpty, IsString } from "class-validator"

export class UpdateSubscribedUserDto {

    @IsString()
    @IsNotEmpty()
    name:                         string
}