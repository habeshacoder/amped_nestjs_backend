/* eslint-disable prefer-const */
import { Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialDto } from './dto';
import { Catagory, Material, Parent, Type, User } from '@prisma/client';
import { MaterialQueryService } from './material-query.service';
import { MaterialStorageService } from './material-storage.service';
import {
  ConflictError,
  DomainException,
  NotFoundError,
} from '../common/exceptions/domain-exceptions';

@Injectable()
export class MaterialService {
  private readonly logger = new Logger(MaterialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: MaterialQueryService,
    private readonly storageService: MaterialStorageService,
  ) {}

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Credentials Taken', 'CREDENTIALS_TAKEN');
    }
    if (error instanceof DomainException) {
      throw error;
    }
    throw error;
  }

  async create(materialDto: MaterialDto) {
    try {
      const material = await this.prisma.material.create({
        data: {
          parent: materialDto.parent,
          type: materialDto.type,
          genere: materialDto.genere,
          catagory: materialDto.catagory,
          title: materialDto.title,
          description: materialDto.description,
          price: materialDto.price,
          author: materialDto.author,
          reader: materialDto.reader,
          translator: materialDto.translator,
          length_minute: materialDto.length_minute,
          length_page: materialDto.length_page,
          material: 'null',
          first_published_at: materialDto.first_published_at?.toString(),
          language: materialDto.language,
          publisher: materialDto.publisher,
          episode: materialDto.episode,
          continues_from: materialDto.continues_from,
          sellerProfile_id: materialDto.sellerProfile_id,
        },
      });

      return material;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, materialDto: MaterialDto) {
    const material = await this.prisma.material.findFirst({
      where: { id },
    });

    if (!material) {
      throw new NotFoundError(
        "Can't update while there is no material. Please create a material first.",
        'MATERIAL_NOT_FOUND',
      );
    }

    try {
      return await this.prisma.material.update({
        where: { id },
        data: {
          parent: materialDto.parent,
          type: materialDto.type,
          genere: materialDto.genere,
          catagory: materialDto.catagory,
          title: materialDto.title,
          description: materialDto.description,
          price: materialDto.price,
          author: materialDto.author,
          reader: materialDto.reader,
          translator: materialDto.translator,
          length_minute: materialDto.length_minute,
          length_page: materialDto.length_page,
          first_published_at: materialDto.first_published_at?.toString(),
          language: materialDto.language,
          publisher: materialDto.publisher,
          episode: materialDto.episode,
          continues_from: materialDto.continues_from,
          sellerProfile_id: materialDto.sellerProfile_id,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const material = await this.prisma.material.findFirst({
      where: { id },
    });

    if (!material) {
      throw new NotFoundError(
        "Can't delete while there is no material. Please create a material first.",
        'MATERIAL_NOT_FOUND',
      );
    }

    try {
      await this.prisma.material.delete({
        where: { id },
      });
      return { message: 'Material deleted successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  // Delegated Query Methods
  async findAll() {
    return this.queryService.findAll();
  }

  async getHomeItems() {
    return this.queryService.getHomeItems();
  }

  async getMaterialByType(materialType: Type) {
    return this.queryService.getMaterialByType(materialType);
  }

  async getMaterialByParent(materialParent: Parent) {
    return this.queryService.getMaterialByParent(materialParent);
  }

  async getMaterialByCatagory(catagory: Catagory) {
    return this.queryService.getMaterialByCatagory(catagory);
  }

  async getMaterialByPublicationYear(pub_year: string) {
    return this.queryService.getMaterialByPublicationYear(pub_year);
  }

  async paginateMaterialByType(
    materialType: Type,
    params: { take?: number; page?: number },
  ) {
    return this.queryService.paginateMaterialByType(materialType, params);
  }

  async getMaterialsWeb(params: { take?: number; page?: number }) {
    return this.queryService.getMaterialsWeb(params);
  }

  async getMaterialsMob(params: { take?: number }): Promise<Material[]> {
    return this.queryService.getMaterialsMob(params);
  }

  async findOne(id: number) {
    return this.queryService.findOne(id);
  }

  async paginateSellerMaterials(
    seller_id: number,
    params: { take?: number; page?: number },
  ) {
    return this.queryService.paginateSellerMaterials(seller_id, params);
  }

  async findForSeller(id: number) {
    return this.queryService.findForSeller(id);
  }

  async getUserMaterial(user: User) {
    return this.queryService.getUserMaterial(user);
  }

  async isMaterialPurchased(user: User, material_id: number) {
    return this.queryService.isMaterialPurchased(user, material_id);
  }

  async getMaterialCoverName(id: number) {
    return this.queryService.getMaterialCoverName(id);
  }

  async getMaterialPreviewImages(materialId: number) {
    return this.queryService.getMaterialPreviewImages(materialId);
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
