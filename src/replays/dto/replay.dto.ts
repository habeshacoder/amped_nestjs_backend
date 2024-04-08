import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class ReplayDto {

    @IsNotEmpty({message: 'Replay cannot be empty'})
    @IsString({message: 'Replay must be a string'})
    @MaxLength(200)
    replay:                     string

    @IsInt()
    @IsNotEmpty({message: 'Remark cannot be empty'})
    remark_id:                 number

}

