import { IsInt, IsNotEmpty, IsString } from "class-validator"

export class SocialLinksProfileDto {
    @IsString({message: 'Link must be a string'})
    link:               string

    @IsNotEmpty({message: 'Seller Profile cannot be empty'})
    @IsInt({message: 'Seller Profile Must be Provided'})
    sellerProfile_id:   number
}
