/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class ChannelDto {
    @IsString({message: 'Channel Name must be a string'})
    @IsNotEmpty({message: 'Channel Name can\'t be empty'})
    name:                       string

    @IsString({message: 'Channel Description must be a string'})
    description:                string

    // @IsNotEmpty({message: 'Subscription Price can\'t be empty'})
    // @IsNumber()
    // price:                      number

    @IsNotEmpty({message: 'Channel Owner can\'t be empty'})
    @IsString()
    sellerProfile_id:           string
}
