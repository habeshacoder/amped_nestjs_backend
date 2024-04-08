import { IsNotEmpty, IsString, MaxLength } from "class-validator"

export class UpdateReplayDto {

    @IsNotEmpty({message: 'Replay cannot be empty'})
    @IsString({message: 'Replay must be a string'})
    @MaxLength(200)
    replay:          string
}

