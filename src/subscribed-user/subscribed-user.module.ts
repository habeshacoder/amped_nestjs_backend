import { Module } from "@nestjs/common";
import { SubscribedUserService } from "./subscribed-user.service";
import { SebscribedUserController } from "./subscribed-user.controller";

@Module({
    controllers: [SebscribedUserController],
    providers: [SubscribedUserService],
})
export class SubscibedUserModule {}