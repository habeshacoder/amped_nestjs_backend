/* eslint-disable prefer-const */
import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMaterialDto } from './dto';
import { Type } from '@prisma/client';
import { ChannelMaterialQueryService } from './channel-material-query.service';
import { ChannelMaterialStorageService } from './channel-material-storage.service';

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
        for await (let sub of materialDto.subscription_id) {
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials Taken');
        }
      }
      throw new ForbiddenException(
        'There has been an error. Please check the inputs and try again.',
      );
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

        if (newMaterial) {
          return newMaterial;
        } else {
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ForbiddenException('Credentials Taken');
          }
        }
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
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
        const deleted = await this.prisma.channelMaterial.delete({
          where: {
            id: id,
          },
        });

        if (deleted) {
          return { message: 'Material deleted successfully' };
        }
      } catch (error) {
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't delete while there is no material. Please create a material first.",
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
  async createFile(images: any, id: number) {
    return this.storageService.createFile(images, id);
  }

  async updateMaterial(materialFile: any, id: number) {
    return this.storageService.updateMaterial(materialFile, id);
  }

  async updateMaterialProfile(materialProfile: any, id: number) {
    return this.storageService.updateMaterialProfile(materialProfile, id);
  }

  async updateMaterialCover(materialCover: any, id: number) {
    return this.storageService.updateMaterialCover(materialCover, id);
  }

  async updateMaterialPreview(materialPreview: any, id: number) {
    return this.storageService.updateMaterialPreview(materialPreview, id);
  }

  async updateMaterialImage(materialPreview: any, id: number) {
    return this.storageService.updateMaterialImage(materialPreview, id);
  }

  async uploadMaterial(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterial(file, id);
  }

  async showMaterial(id: number, @Res() res: any) {
    return this.storageService.showMaterial(id, res);
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialProfile(file, id);
  }

  async showMaterialProfile(id: number, @Res() res: any) {
    return this.storageService.showMaterialProfile(id, res);
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialCover(file, id);
  }

  async showMaterialCover(id: number, @Res() res: any) {
    return this.storageService.showMaterialCover(id, res);
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    return this.storageService.uploadMaterialImage(files, id);
  }

  async showMaterialImage(id: number, @Res() res: any) {
    return this.storageService.showMaterialImage(id, res);
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    return this.storageService.uploadMaterialPreview(file, id);
  }

  async showMaterialPreview(id: number, @Res() res: any) {
    return this.storageService.showMaterialPreview(id, res);
  }
}
