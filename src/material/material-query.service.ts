import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { Catagory, Material, Parent, Prisma, Type, User } from '@prisma/client';

@Injectable()
export class MaterialQueryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.material.findMany({
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
        SellerProfile: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getHomeItems() {
    return [];
  }

  async getMaterialByType(materialType: Type) {
    const mat = await this.prisma.material.findMany({
      where: {
        type: materialType,
      },
      include: {
        material_image: true,
        material_preview: true,
        rate: true,
        report: true,
      },
    });

    const shuffledElements = mat.sort(() => 0.5 - Math.random());
    return shuffledElements.slice(0, 3);
  }

  async getMaterialByParent(materialParent: Parent) {
    const mat = await this.prisma.material.findMany({
      where: {
        parent: materialParent,
      },
      include: {
        material_image: true,
        material_preview: true,
        rate: true,
        report: true,
      },
    });
    return mat;
  }

  async getMaterialByCatagory(catagory: Catagory) {
    const mat = await this.prisma.material.findMany({
      where: {
        catagory: catagory,
      },
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
      },
    });

    return mat;
  }

  async getMaterialByPublicationYear(pub_year: string) {
    const mat = await this.prisma.material.findMany({
      where: {
        first_published_at: pub_year,
      },
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
      },
    });

    return mat;
  }

  private computePagination(
    count: number,
    take: number,
    page: number,
    baseUrl?: string,
  ) {
    const totalPages = Math.ceil(count / take);
    if (page < 0 || page >= totalPages) {
      throw new ForbiddenException('Page Not Found');
    }

    const previousPage = page === 0 ? null : page - 1;
    const nextPage = page + 1 >= totalPages ? null : page + 1;
    const lastPage = totalPages - 1;
    let material_in_last_page = count % take;
    if (material_in_last_page === 0) material_in_last_page = take;

    const meta: Record<string, any> = {
      self: page,
      prev: previousPage,
      next: nextPage,
      last: lastPage,
    };

    if (baseUrl) {
      meta.Num_Of_Materials = count;
      meta.Num_Of_Pages = totalPages;
      meta.Per_Page = take;
      meta.Materials_In_last_page = material_in_last_page;
      meta.Links = [
        { first: `${baseUrl}?take=${take}&page=0` },
        { self: `${baseUrl}?take=${take}&page=${page}` },
        { prev: `${baseUrl}?take=${take}&page=${previousPage}` },
        { next: `${baseUrl}?take=${take}&page=${nextPage}` },
        { last: `${baseUrl}?take=${take}&page=${lastPage}` },
      ];
    }

    return { skip: take * page, meta };
  }

  async paginateMaterialByType(
    materialType: Type,
    params: { take?: number; page?: number },
  ) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.prisma.material.count({
      where: { type: materialType },
    });
    const { skip, meta } = this.computePagination(
      numOfMaterial,
      take,
      page,
      'http://localhost:3007/material/materials_web',
    );

    const materials = await this.prisma.material.findMany({
      take,
      skip,
      where: { type: materialType },
      orderBy: { id: 'desc' },
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
      },
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsWeb(params: { take?: number; page?: number }) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.prisma.material.count();
    const { skip, meta } = this.computePagination(
      numOfMaterial,
      take,
      page,
      'http://localhost:3007/material/materials_web',
    );

    const materials = await this.prisma.material.findMany({
      take,
      skip,
      orderBy: { id: 'desc' },
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsMob(params: { take?: number }): Promise<Material[]> {
    const { take } = params;

    let lastMaterialId = 0;

    const count = await this.prisma.material.findMany({
      orderBy: { id: 'desc' },
    });

    for (const x of count) {
      lastMaterialId = x['id'];
      break;
    }

    const cursor: Prisma.MaterialWhereUniqueInput = {
      id: Number(lastMaterialId),
    };

    return await this.prisma.material.findMany({
      cursor,
      take,
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    try {
      const material = await this.prisma.material.findUnique({
        where: {
          id: id,
        },
        include: {
          material_image: true,
          material_preview: true,
          material_user: true,
          rate: true,
          report: true,
        },
      });

      if (material) {
        return material;
      } else {
        return { message: 'Material Not Found' };
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Wrong link');
        }
      }
      throw new ForbiddenException(
        'There has been an error. Please check the link and try again.',
      );
    }
  }

  async paginateSellerMaterials(
    seller_id: number,
    params: { take?: number; page?: number },
  ) {
    const { take = 10, page = 0 } = params;
    const numOfMaterial = await this.prisma.material.count({
      where: { sellerProfile_id: seller_id },
    });
    const { skip, meta } = this.computePagination(numOfMaterial, take, page);

    const sellerMaterials = await this.prisma.material.findMany({
      take,
      skip,
      where: {
        sellerProfile_id: seller_id,
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
      },
    });

    return { Materials: sellerMaterials, Meta: meta };
  }

  async findForSeller(id: number) {
    const myMaterials = await this.prisma.material.findMany({
      where: {
        sellerProfile_id: id,
      },
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
      },
    });

    return myMaterials;
  }

  async getUserMaterial(user: User) {
    const purchasedMaterials = await this.prisma.materialUser.findMany({
      where: {
        user_id: user.id,
      },
    });

    const userMaterials = [];
    for (let i = 0; i < purchasedMaterials.length; i++) {
      userMaterials.push(
        await this.prisma.material.findMany({
          where: {
            id: purchasedMaterials[i].material_id,
          },
          include: {
            material_image: true,
            material_preview: true,
            material_user: true,
            rate: true,
            report: true,
          },
        }),
      );
    }
    return userMaterials;
  }

  async isMaterialPurchased(user: User, material_id: number) {
    const userMaterial = await this.prisma.materialUser.findFirst({
      where: {
        user_id: user.id,
        material_id: material_id,
      },
    });

    return !!userMaterial;
  }

  async getMaterialCoverName(id: number) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
      },
    });

    return materialImage?.image;
  }

  async getMaterialPreviewImages(materialId: number) {
    const previewImages = await this.prisma.materialImage.findMany({
      where: {
        material_id: materialId,
        cover: false,
        primary: false,
      },
    });

    return previewImages;
  }
}
