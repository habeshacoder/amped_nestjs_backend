import { IsInt, IsNotEmpty, IsString } from "class-validator"

export class SocialLinksChannelDto {
    // @IsNotEmpty({message: 'Name cannot be empty'})
    // @IsString({message: 'Name must be a string'})
    // name:               string

    // @IsString({message: 'Description must be a string'})
    // description:        string

    @IsString({message: 'Link must be a string'})
    @IsNotEmpty({message: 'Link cannot be empty'})
    link:               string

    @IsNotEmpty({message: 'Seller Profile cannot be empty'})
    @IsInt({message: 'Seller Profile Must be Provided'})
    channel_id:   number
}
