import { IsArray, IsNotEmpty } from "class-validator"

export class SubscriptionPlanDto {
    @IsArray()
    @IsNotEmpty({message: 'Subscription Plan Name can\'t be empty'})
    name:                   Array<string>

    @IsArray()
    description:            Array<string>

    @IsArray()
    @IsNotEmpty({message: 'Subscription Plan Price can\'t be empty'})
    price:                  Array<string>

    @IsArray()
    @IsNotEmpty({message: 'Subscription Plan Price can\'t be empty'})
    channel_id:             Array<string>
}



  