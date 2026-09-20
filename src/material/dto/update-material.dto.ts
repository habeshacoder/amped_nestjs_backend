import { PartialType } from '@nestjs/swagger';
import { MaterialDto } from './material.dto';

export class UpdateMaterialDto extends PartialType(MaterialDto) {}
