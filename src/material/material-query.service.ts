import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Catagory, Material, Parent, Prisma, Type, User } from '@prisma/client';
import {
  ConflictError,
  DomainException,
} from '../common/exceptions/domain-exceptions';
import { computePagination } from '../common/utils/pagination.util';
import { MATERIAL_INCLUDE } from './material-query.constants';
import { MaterialRepository } from './material.repository';

@Injectable()
export class MaterialQueryService {
  constructor(private readonly materialRepo: MaterialRepository) {}

  async findAll() {
    return await this.materialRepo.findMany({
      include: {
        ...MATERIAL_INCLUDE,
        SellerProfile: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getHomeItems(): Promise<Material[]> {
    return await this.materialRepo.findMany({
      take: 10,
      orderBy: {
        id: 'desc',
      },
      include: {
        ...MATERIAL_INCLUDE,
        SellerProfile: true,
      },
    });
  }

  async getMaterialByType(materialType: Type) {
    const mat = await this.materialRepo.findMany({
      where: {
        type: materialType,
      },
      include: MATERIAL_INCLUDE,
    });

    const shuffledElements = mat.sort(() => 0.5 - Math.random());
    return shuffledElements.slice(0, 3);
  }

  async getMaterialByParent(materialParent: Parent) {
    const mat = await this.materialRepo.findMany({
      where: {
        parent: materialParent,
      },
      include: MATERIAL_INCLUDE,
    });
    return mat;
  }

  async getMaterialByCatagory(catagory: Catagory) {
    const mat = await this.materialRepo.findMany({
      where: {
        catagory: catagory,
      },
      include: MATERIAL_INCLUDE,
    });

    return mat;
  }

  async getMaterialByPublicationYear(pub_year: string) {
    const mat = await this.materialRepo.findMany({
      where: {
        first_published_at: pub_year,
      },
      include: MATERIAL_INCLUDE,
    });

    return mat;
  }

  async paginateMaterialByType(
    materialType: Type,
    params: { take?: number; page?: number },
  ) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.materialRepo.count({
      where: { type: materialType },
    });
    const { skip, meta } = computePagination(
      numOfMaterial,
      take,
      page,
      'http://localhost:3007/material/materials_web',
    );

    const materials = await this.materialRepo.findMany({
      take,
      skip,
      where: { type: materialType },
      orderBy: { id: 'desc' },
      include: MATERIAL_INCLUDE,
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsWeb(params: { take?: number; page?: number }) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.materialRepo.count();
    const { skip, meta } = computePagination(
      numOfMaterial,
      take,
      page,
      'http://localhost:3007/material/materials_web',
    );

    const materials = await this.materialRepo.findMany({
      take,
      skip,
      orderBy: { id: 'desc' },
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsMob(params: { take?: number }): Promise<Material[]> {
    const { take } = params;

    let lastMaterialId = 0;

    const count = await this.materialRepo.findMany({
      orderBy: { id: 'desc' },
    });

    for (const x of count) {
      lastMaterialId = x['id'];
      break;
    }

    const cursor: Prisma.MaterialWhereUniqueInput = {
      id: Number(lastMaterialId),
    };

    return await this.materialRepo.findMany({
      cursor,
      take,
      orderBy: {
        id: 'desc',
      },
    });
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Wrong link', 'CONFLICT');
    }
    if (error instanceof DomainException) {
      throw error;
    }
    throw error;
  }

  async findOne(id: number) {
    try {
      const material = await this.materialRepo.findUnique({
        where: {
          id: id,
        },
        include: MATERIAL_INCLUDE,
      });

      if (material) {
        return material;
      } else {
        return { message: 'Material Not Found' };
      }
    } catch (error) {
      throw this.handlePrismaError(error);
    }
  }

  async paginateSellerMaterials(
    seller_id: number,
    params: { take?: number; page?: number },
  ) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.materialRepo.count({
      where: { sellerProfile_id: seller_id },
    });
    const { skip, meta } = computePagination(numOfMaterial, take, page);

    const sellerMaterials = await this.materialRepo.findMany({
      take,
      skip,
      where: {
        sellerProfile_id: seller_id,
      },
      orderBy: {
        id: 'desc',
      },
      include: MATERIAL_INCLUDE,
    });

    return { Materials: sellerMaterials, Meta: meta };
  }

  async findForSeller(id: number) {
    const myMaterials = await this.materialRepo.findMany({
      where: {
        sellerProfile_id: id,
      },
      include: MATERIAL_INCLUDE,
    });

    return myMaterials;
  }

  async getUserMaterial(user: User) {
    const purchasedMaterials = await this.materialRepo.findMaterialUsers({
      where: {
        user_id: user.id,
      },
    });

    const userMaterials = [];
    for (let i = 0; i < purchasedMaterials.length; i++) {
      userMaterials.push(
        await this.materialRepo.findMany({
          where: {
            id: purchasedMaterials[i].material_id,
          },
          include: MATERIAL_INCLUDE,
        }),
      );
    }
    return userMaterials;
  }

  async isMaterialPurchased(user: User, material_id: number) {
    const userMaterial = await this.materialRepo.findFirstMaterialUser({
      where: {
        user_id: user.id,
        material_id: material_id,
      },
    });

    return !!userMaterial;
  }

  async getMaterialCoverName(id: number) {
    const materialImage = await this.materialRepo.findFirstMaterialImage({
      where: {
        material_id: id,
      },
    });

    return materialImage?.image;
  }

  async getMaterialPreviewImages(materialId: number) {
    const previewImages = await this.materialRepo.findMaterialImages({
      where: {
        material_id: materialId,
        cover: false,
        primary: false,
      },
    });

    return previewImages;
  }
}
