import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { ReportType } from "@prisma/client";

export class ReportDto {

    @IsNotEmpty({message: 'Report Type can\'t be empty'})
    @IsIn(["HateSpeach", "GenderViolation", "InappropriateAgeRange", "Stereotype", "Descrimination", "Unspecified"])
    @IsString({message: 'Report type  must be a string'})
    report_type:                     ReportType

    @IsNotEmpty({message: 'Report Description cannot be empty'})
    @IsString({message: 'Report Description  must be a string'})
    @MaxLength(200)
    report_desc:                    string

    @IsNumber()
    @IsOptional()
    material_id?:                    number

    @IsNumber()
    @IsOptional()
    channel_id?:                    number
}

