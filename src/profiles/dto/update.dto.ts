import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator"
import { Match } from './../../auth/decorator/match.decorator'


export class UpdateDto {
    @IsString()
    @MinLength(4)
    @MaxLength(20)
    @IsNotEmpty()
    oldPassword:            string

    @IsString()
    @MinLength(4)
    @MaxLength(20)
    @IsNotEmpty()
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
    newPassword:            string

    @IsString()
    @MinLength(4)
    @MaxLength(20)
    @IsNotEmpty()
    @Match('newPassword')
    newPasswordConfirm:     string;
}