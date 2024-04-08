import { Module } from "@nestjs/common";
import { ReplayService } from "./replay.service";
import { ReplayController } from "./replay.controller";

@Module({
    controllers: [ReplayController],
    providers: [ReplayService] 
})
export class ReplayModule{}