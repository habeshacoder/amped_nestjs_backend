import { Injectable, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMaterialDto } from './dto';
import { Type } from '@prisma/client';
import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';
import { NotFoundError } from '../common/exceptions/domain-exceptions';
import { UploadedImages } from '../common/services/file-storage.service';
import { handlePrismaError } from '../common/services/prisma-error.util';

@Injectable()
export class ChannelMaterialService {
  private readonly logger = new Logger(ChannelMaterialService.name);

  constructor(
    private prisma: PrismaService,
    private queryService: ChannelMaterialQueryService,
    private storageService: ChannelMaterialStorageService,
  ) {}

  async create(materialDto: ChannelMaterialDto) {
    try {
      const material = await this.prisma.channelMaterial.create({
        data: {
          parent: materialDto.parent,
          type: materialDto.type,
          genere: materialDto.genere,
          catagory: materialDto.catagory,
          title: materialDto.title,
          description: materialDto.description,
          material: 'null',
          author: materialDto.author,
          reader: materialDto.reader,
          translator: materialDto.translator,
          length_minute: materialDto.length_minute,
          length_page: materialDto.length_page,
          first_published_at: materialDto.first_published_at,
          language: materialDto.language,
          publisher: materialDto.publisher,
          episode: materialDto.episode,
          continues_from: materialDto.continues_from,
          sellerProfile_id: materialDto.sellerProfile_id,
        },
      });

      if (material && materialDto.subscription_id != null) {
        for await (const sub of materialDto.subscription_id) {
          await this.prisma.materialInSubscriptionPlan.create({
            data: {
              channelMaterial_id: material.id,
              subscriptionPlan_id: sub,
            },
          });
        }
      }
      return material;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(id: number, materialDto: ChannelMaterialDto) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      try {
        const newMaterial = await this.prisma.channelMaterial.update({
          where: {
            id: id,
          },
          data: {
            parent: materialDto.parent,
            type: materialDto.type,
            genere: materialDto.genere,
            catagory: materialDto.catagory,
            title: materialDto.title,
            description: materialDto.description,
            author: materialDto.author,
            reader: materialDto.reader,
            translator: materialDto.translator,
            length_minute: materialDto.length_minute,
            length_page: materialDto.length_page,
            first_published_at: materialDto.first_published_at,
            language: materialDto.language,
            publisher: materialDto.publisher,
            episode: materialDto.episode,
            continues_from: materialDto.continues_from,
            sellerProfile_id: materialDto.sellerProfile_id,
          },
        });

        return newMaterial;
      } catch (error) {
        handlePrismaError(error);
      }
    } else {
      throw new NotFoundError(
        "Can't update while there is no material. Please create a material first.",
        'CHANNEL_MATERIAL_NOT_FOUND',
      );
    }
  }

  async remove(id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      try {
        await this.prisma.channelMaterial.delete({
          where: {
            id: id,
          },
        });
        return { message: 'Material deleted successfully' };
      } catch (error) {
        handlePrismaError(error);
      }
    } else {
      throw new NotFoundError(
        "Can't delete while there is no material. Please create a material first.",
        'CHANNEL_MATERIAL_NOT_FOUND',
      );
    }
  }

  // Delegated Query Methods
  async findAll() {
    return this.queryService.findAll();
  }

  async getMaterialByType(materialType: Type) {
    return this.queryService.getMaterialByType(materialType);
  }

  async findOne(id: number) {
    return this.queryService.findOne(id);
  }

  async findForSeller(id: number) {
    return this.queryService.findForSeller(id);
  }

  async getMaterialCoverName(id: number) {
    return this.queryService.getMaterialCoverName(id);
  }

  // Delegated Storage Methods
  async createFile(images: UploadedImages, id: number) {
    return this.storageService.createFile(images, id);
  }

  async updateMaterial(materialFile: UploadedImages, id: number) {
    return this.storageService.updateMaterial(materialFile, id);
  }

  async updateMaterialProfile(materialProfile: UploadedImages, id: number) {
    return this.storageService.updateMaterialProfile(materialProfile, id);
  }

  async updateMaterialCover(materialCover: UploadedImages, id: number) {
    return this.storageService.updateMaterialCover(materialCover, id);
  }

  async updateMaterialPreview(materialPreview: UploadedImages, id: number) {
    return this.storageService.updateMaterialPreview(materialPreview, id);
  }

  async updateMaterialImage(materialImages: UploadedImages, id: number) {
    return this.storageService.updateMaterialImage(materialImages, id);
  }

  async uploadMaterial(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterial(file, id);
  }

  async showMaterial(id: number, @Res() res: Response) {
    return this.storageService.showMaterial(id, res);
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialProfile(file, id);
  }

  async showMaterialProfile(id: number, @Res() res: Response) {
    return this.storageService.showMaterialProfile(id, res);
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialCover(file, id);
  }

  async showMaterialCover(id: number, @Res() res: Response) {
    return this.storageService.showMaterialCover(id, res);
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    return this.storageService.uploadMaterialImage(files, id);
  }

  async showMaterialImage(id: number, @Res() res: Response) {
    return this.storageService.showMaterialImage(id, res);
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialPreview(file, id);
  }

  async showMaterialPreview(id: number, @Res() res: Response) {
    return this.storageService.showMaterialPreview(id, res);
  }
}
