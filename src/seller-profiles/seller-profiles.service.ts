import { Injectable, Logger } from '@nestjs/common';
import { SellerProfileDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';
import {
  ConflictError,
  DomainException,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';

@Injectable()
export class SellerProfilesService {
  private readonly logger = new Logger(SellerProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
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

  async create(
    images: UploadedImages,
    sellerProfileDto: SellerProfileDto,
    user: User,
  ) {
    const imageName =
      this.fileStorage.extractFieldFileName(images, 'image') ||
      this.fileStorage.extractFieldFileName(images, 'profile');
    const coverName = this.fileStorage.extractFieldFileName(images, 'cover');

    try {
      const sProfile = await this.prisma.sellerProfile.create({
        data: {
          name: sellerProfileDto.name,
          description: sellerProfileDto.description,
          sex: sellerProfileDto.sex,
          date_of_birth: sellerProfileDto.date_of_birth,
          image: imageName || 'null',
          cover_image: coverName || 'null',
          user_id: user.id,
        },
      });

      return sProfile;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    return await this.prisma.sellerProfile.findMany({
      include: {
        User: true,
        channel: true,
        channel_material: true,
        material: true,
      },
    });
  }

  async findOne(id: number) {
    if (!Number.isNaN(id) && id != null) {
      try {
        const profile = await this.prisma.sellerProfile.findUnique({
          where: { id },
          include: {
            social_links_profile: true,
          },
        });
        if (!profile) {
          throw new NotFoundError(
            'There is no profile. Please create a profile first.',
            'SELLER_PROFILE_NOT_FOUND',
          );
        }
        return profile;
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ValidationError(
        'There is no profile. Please create a profile first.',
        'INVALID_ID',
      );
    }
  }

  async findMe(user: User) {
    return await this.prisma.sellerProfile.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        social_links_profile: true,
      },
    });
  }

  async updateProfileInfo(id: number, sellerProfileDto: SellerProfileDto) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    try {
      return await this.prisma.sellerProfile.update({
        where: { id },
        data: {
          name: sellerProfileDto.name,
          description: sellerProfileDto.description,
          sex: sellerProfileDto.sex,
          date_of_birth: sellerProfileDto.date_of_birth,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateProfileImage(profileImage: UploadedImages, id: number) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    const imageName =
      this.fileStorage.extractFieldFileName(profileImage, 'image') ||
      this.fileStorage.extractFieldFileName(profileImage, 'profile');

    if (!imageName) {
      return { message: 'Profile Image Uploaded Successfully' };
    }

    try {
      const oldImage = sProfile.image;
      await this.prisma.sellerProfile.update({
        where: { id: sProfile.id },
        data: { image: imageName },
      });

      if (oldImage && oldImage !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', oldImage);
      }

      return { message: 'Profile Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateCoverImage(coverImage: UploadedImages, id: number) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    const coverName = this.fileStorage.extractFieldFileName(
      coverImage,
      'cover',
    );
    if (!coverName) {
      return { message: 'Cover Image Uploaded Successfully' };
    }

    try {
      const oldCover = sProfile.cover_image;
      await this.prisma.sellerProfile.update({
        where: { id: sProfile.id },
        data: { cover_image: coverName },
      });

      if (oldCover && oldCover !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', oldCover);
      }

      return { message: 'Cover Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't delete while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    const image = sProfile.image;
    const cover = sProfile.cover_image;

    try {
      await this.prisma.sellerProfile.delete({ where: { id } });

      if (image && image !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', image);
      }
      if (cover && cover !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', cover);
      }

      return { message: 'Seller Profile deleted successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadImage(image: Express.Multer.File, id: number) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFileName(
      image?.filename || image?.path,
    );

    try {
      const oldImage = sProfile.image;
      const updated = await this.prisma.sellerProfile.update({
        where: { id: sProfile.id },
        data: { image: fileName },
      });

      if (oldImage && oldImage !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', oldImage);
      }

      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async uploadCover(image: Express.Multer.File, id: number) {
    const sProfile = await this.prisma.sellerProfile.findFirst({
      where: { id },
    });

    if (!sProfile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'SELLER_PROFILE_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFileName(
      image?.filename || image?.path,
    );

    try {
      const oldCover = sProfile.cover_image;
      const updated = await this.prisma.sellerProfile.update({
        where: { id: sProfile.id },
        data: { cover_image: fileName },
      });

      if (oldCover && oldCover !== 'null') {
        await this.fileStorage.deleteFile('sellerProfile/image', oldCover);
      }

      return updated;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }
}
