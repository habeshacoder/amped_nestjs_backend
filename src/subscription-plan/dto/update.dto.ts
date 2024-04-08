import { IsNotEmpty, IsString } from "class-validator"

export class UpdateDto {
    @IsString({message: 'Subscription Plan Name can\'t be empty'})
    @IsNotEmpty({message: 'Subscription Plan Name can\'t be empty'})
    name:                   string

    @IsString({message: 'Subscription Plan Description Name can\'t be empty'})
    description:            string

    @IsString({message: 'Subscription Plan Price can\'t be empty'})
    @IsNotEmpty({message: 'Subscription Plan Price can\'t be empty'})
    price:                  string

    @IsString({message: 'Channel Id can\'t be empty'})
    @IsNotEmpty({message: 'Channel Id can\'t be empty'})
    channel_id:             string
}
