import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args?: Prisma.MaterialFindManyArgs) {
    return this.prisma.material.findMany(args);
  }

  async findUnique(args: Prisma.MaterialFindUniqueArgs) {
    return this.prisma.material.findUnique(args);
  }

  async findFirst(args?: Prisma.MaterialFindFirstArgs) {
    return this.prisma.material.findFirst(args);
  }

  async count(args?: Prisma.MaterialCountArgs) {
    return this.prisma.material.count(args);
  }

  async create(args: Prisma.MaterialCreateArgs) {
    return this.prisma.material.create(args);
  }

  async update(args: Prisma.MaterialUpdateArgs) {
    return this.prisma.material.update(args);
  }

  async delete(args: Prisma.MaterialDeleteArgs) {
    return this.prisma.material.delete(args);
  }

  async findMaterialUsers(args: Prisma.MaterialUserFindManyArgs) {
    return this.prisma.materialUser.findMany(args);
  }

  async findFirstMaterialUser(args: Prisma.MaterialUserFindFirstArgs) {
    return this.prisma.materialUser.findFirst(args);
  }

  async findMaterialImages(args: Prisma.MaterialImageFindManyArgs) {
    return this.prisma.materialImage.findMany(args);
  }

  async findFirstMaterialImage(args: Prisma.MaterialImageFindFirstArgs) {
    return this.prisma.materialImage.findFirst(args);
  }
}
