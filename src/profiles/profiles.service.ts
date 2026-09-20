import { Injectable, Logger } from '@nestjs/common';
import { ProfileDto, UpdateDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';
import * as argon from 'argon2';
import {
  FileStorageService,
  UploadedImages,
} from '../common/services/file-storage.service';
import {
  ConflictError,
  DomainException,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

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

  async create(images: UploadedImages, profileDto: ProfileDto, user: User) {
    const existing = await this.prisma.profile.findFirst({
      where: { user_id: user.id },
    });

    if (existing) {
      throw new ConflictError(
        "Can't create a profile while the user already have a profile. Please try updating the profile.",
        'PROFILE_EXISTS',
      );
    }

    const profileImage = this.fileStorage.extractFieldFileName(
      images,
      'profile',
    );
    const coverImage = this.fileStorage.extractFieldFileName(images, 'cover');

    try {
      return await this.prisma.profile.create({
        data: {
          first_name: profileDto.first_name,
          last_name: profileDto.last_name,
          sex: profileDto.sex,
          date_of_birth: profileDto.date_of_birth,
          profile_image: profileImage || 'null',
          cover_image: coverImage || 'null',
          user_id: user.id,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    const profiles = await this.prisma.profile.findMany({
      include: { User: true },
      orderBy: { id: 'asc' },
    });

    return profiles || { message: 'No profile found.' };
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    return profile || { message: 'No profile found.' };
  }

  async findProfileByUserId(userId: string) {
    return await this.prisma.profile.findFirst({
      where: { user_id: userId },
    });
  }

  async findMe(user: User) {
    const profile = await this.prisma.profile.findFirst({
      where: { user_id: user.id },
    });
    return profile || { message: 'No profile found.' };
  }

  async updateProfile(id: number, profileDto: ProfileDto) {
    const profile = await this.prisma.profile.findFirst({ where: { id } });
    if (!profile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'PROFILE_NOT_FOUND',
      );
    }

    try {
      return await this.prisma.profile.update({
        where: { id },
        data: {
          first_name: profileDto.first_name,
          last_name: profileDto.last_name,
          sex: profileDto.sex,
          date_of_birth: profileDto.date_of_birth,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateProfileImage(profileImage: UploadedImages, id: number) {
    const profile = await this.prisma.profile.findFirst({ where: { id } });
    if (!profile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'PROFILE_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(
      profileImage,
      'profile',
    );
    if (!fileName) {
      return { message: 'Profile Image Uploaded Successfully' };
    }

    try {
      const oldImage = profile.profile_image;
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: { profile_image: fileName },
      });

      if (oldImage && oldImage !== 'null') {
        await this.fileStorage.deleteFile('profile/profile', oldImage);
      }

      return { message: 'Profile Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateCoverImage(coverImage: UploadedImages, id: number) {
    const profile = await this.prisma.profile.findFirst({ where: { id } });
    if (!profile) {
      throw new NotFoundError(
        "Can't update while there is no profile. Please create a profile first.",
        'PROFILE_NOT_FOUND',
      );
    }

    const fileName = this.fileStorage.extractFieldFileName(coverImage, 'cover');
    if (!fileName) {
      return { message: 'Cover Image Uploaded Successfully' };
    }

    try {
      const oldCover = profile.cover_image;
      await this.prisma.profile.update({
        where: { id: profile.id },
        data: { cover_image: fileName },
      });

      if (oldCover && oldCover !== 'null') {
        await this.fileStorage.deleteFile('profile/profile', oldCover);
      }

      return { message: 'Cover Image Uploaded Successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updatePassword(dto: UpdateDto, user: User) {
    const userPass = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userPass) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const pwMatches = await argon.verify(userPass.password, dto.oldPassword);
    if (!pwMatches) {
      throw new ForbiddenError(
        'Wrong Password Please Try Again',
        'INVALID_CREDENTIALS',
      );
    }

    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new ValidationError(
        'Wrong Password Confirmation, Please Try Again',
        'PASSWORD_MISMATCH',
      );
    }

    const hash = await argon.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    return { message: 'Password Updated Successfully' };
  }

  async remove(id: number) {
    const profile = await this.prisma.profile.findFirst({ where: { id } });
    if (!profile) {
      throw new NotFoundError(
        "Can't delete while there is no profile. Please create a profile first.",
        'PROFILE_NOT_FOUND',
      );
    }

    const image = profile.profile_image;
    const cover = profile.cover_image;

    try {
      await this.prisma.profile.delete({ where: { id } });

      if (image && image !== 'null') {
        await this.fileStorage.deleteFile('profile/profile', image);
      }
      if (cover && cover !== 'null') {
        await this.fileStorage.deleteFile('profile/profile', cover);
      }

      return { message: 'Profile deleted successfully' };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }
}
