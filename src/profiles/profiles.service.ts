/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ProfileDto, UpdateDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { User } from '@prisma/client';
import * as argon from 'argon2';
import { AuthService } from 'src/auth/auth.service';
const fs = require('fs');

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(images, ProfileDto: ProfileDto, user: User) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (!profile) {
      const p_name =
        images['profile'][0].path.split('/')[
          images['profile'][0].path.split('/').length - 1
        ];
      const c_name =
        images['cover'][0].path.split('/')[
          images['cover'][0].path.split('/').length - 1
        ];

      try {
        const profile = await this.prisma.profile.create({
          data: {
            first_name: ProfileDto.first_name,
            last_name: ProfileDto.last_name,
            sex: ProfileDto.sex,
            date_of_birth: ProfileDto.date_of_birth,
            profile_image: p_name,
            cover_image: c_name,
            user_id: user.id,
          },
        });

        if (profile) {
          return profile;
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
        "Can't create a profile while the user already have a profile. Please try updating the profile.",
      );
    }
  }

  async findAll() {
    const profiles = await this.prisma.profile.findMany();

    if (profiles) {
      return profiles;
    } else {
      return { message: 'No profile found.' };
    }
  }

  async findOne(id: number) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: id,
      },
    });

    if (profile) {
      return profile;
    } else {
      return { message: 'No profile found.' };
    }
  }

  async findProfileByUserId(userId: string) {
    return await this.prisma.profile.findFirst({
      where: {
        user_id: userId,
      },
    });
  }

  async findMe(user: User) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (profile) {
      return profile;
    } else {
      return { message: 'No profile found.' };
    }
  }

  async updateProfile(id: number, ProfileDto: ProfileDto) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: id,
      },
    });

    if (profile) {
      try {
        const newProfile = await this.prisma.profile.update({
          where: {
            id: id,
          },
          data: {
            first_name: ProfileDto.first_name,
            last_name: ProfileDto.last_name,
            sex: ProfileDto.sex,
            date_of_birth: ProfileDto.date_of_birth,
          },
        });

        if (newProfile) {
          return newProfile;
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
        "Can't update while there is no profile. Please create a profile first.",
      );
    }
  }

  async updateProfileImage(profileImage, id: number) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: id,
      },
    });

    if (profile) {
      const p_name =
        profileImage['profile'][0].path.split('/')[
          profileImage['profile'][0].path.split('/').length - 1
        ];

      if (p_name != null) {
        try {
          const oldImage = profile.profile_image;

          const newProfile = await this.prisma.profile.update({
            where: {
              id: profile.id,
            },
            data: {
              profile_image: p_name,
            },
          });

          if (newProfile) {
            fs.unlink('./uploads/profile/profile/' + oldImage, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          } else {
            throw new ForbiddenException(
              'There has been an error. Please check the inputs and try again.',
            );
          }

          return {
            message: 'Profile Image Uploaded Successfully',
          };
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
    } else {
      throw new ForbiddenException(
        "Can't update while there is no profile. Please create a profile first.",
      );
    }
  }

  async updateCoverImage(coverImage, id: number) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: id,
      },
    });

    if (profile) {
      const c_name =
        coverImage['cover'][0].path.split('/')[
          coverImage['cover'][0].path.split('/').length - 1
        ];

      if (c_name != null) {
        try {
          const oldCImage = profile.cover_image;

          const newCover = await this.prisma.profile.update({
            where: {
              id: profile.id,
            },
            data: {
              cover_image: c_name[3],
            },
          });

          if (newCover) {
            fs.unlink('./uploads/profile/profile/' + oldCImage, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          } else {
            throw new ForbiddenException(
              'There has been an error. Please check the inputs and try again.',
            );
          }

          return {
            message: 'Cover Image Uploaded Successfully',
          };
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
    } else {
      throw new ForbiddenException(
        "Can't update while there is no profile. Please create a profile first.",
      );
    }
  }

  async updatePassword(dto: UpdateDto, user: User) {
    // console.log("Password:", user)
    const userPass = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    const pwMatches = await argon.verify(userPass.password, dto.oldPassword);

    if (!pwMatches) {
      throw new ForbiddenException('Wrong Password Please Try Again');
    } else {
      if (dto.newPassword === dto.newPasswordConfirm) {
        const hash = await argon.hash(dto.newPassword);

        const updatedUser = await this.prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: hash,
          },
        });

        if (updatedUser) {
          return { message: 'Password Updated Successfully' };
        }
      } else {
        throw new ForbiddenException(
          'Wrong Password Confirmation, Please Try Again',
        );
      }
    }
  }

  async remove(id: number) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id: id,
      },
    });

    if (profile) {
      const image = profile.profile_image;
      const cover = profile.cover_image;
      try {
        const profile = await this.prisma.profile.delete({
          where: {
            id: id,
          },
        });

        if (profile) {
          if (image != 'null') {
            fs.unlink('./uploads/profile/profile/' + image, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
          if (cover != 'null') {
            fs.unlink('./uploads/profile/profile/' + cover, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
          return { message: 'Profile deleted successfully' };
        }
      } catch (error) {
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't delete while there is no profile. Please create a profile first.",
      );
    }
  }

  // async uploadProfile(image: Express.Multer.File, user: User) {
  //     const profile = await this.prisma.profile.findFirst({
  //         where: {
  //             user_id: user.id,
  //         }
  //     })

  //     const name = image.path.split('\\');

  //     if (profile) {
  //         if (profile.profile_image == 'null' || profile.profile_image == null) {
  //             try {
  //                 const newProfile = await this.prisma.profile.update({
  //                     where: {
  //                         id: profile.id,
  //                     },
  //                     data: {
  //                         profile_image: name[3]
  //                     },
  //                 });

  //                 if (newProfile) {
  //                     return newProfile;
  //                 } else {
  //                     throw new ForbiddenException(
  //                         'There has been an error. Please check the inputs and try again.'
  //                     )
  //                 }
  //             } catch (error) {
  //                 if (error instanceof PrismaClientKnownRequestError) {
  //                     if (error.code === 'P2002') {
  //                         throw new ForbiddenException(
  //                             'Credentials Taken'
  //                         )
  //                     }
  //                 }
  //                 throw new ForbiddenException(
  //                     'There has been an error. Please check the inputs and try again.'
  //                 )
  //             }
  //         } else {
  //             const oldImage = profile.profile_image;

  //             try {
  //                 const newProfile = await this.prisma.profile.update({
  //                     where: {
  //                         id: profile.id,
  //                     },
  //                     data: {
  //                         profile_image: name[3]
  //                     },
  //                 });

  //                 if (newProfile) {
  //                     fs.unlink("./uploads/profile/profile/" + oldImage, (err) => {
  //                         if (err) {
  //                             console.error(err)
  //                             return
  //                         }
  //                     })
  //                     return newProfile;
  //                 } else {
  //                     throw new ForbiddenException(
  //                         'There has been an error. Please check the inputs and try again.'
  //                     )
  //                 }
  //             } catch (error) {
  //                 if (error instanceof PrismaClientKnownRequestError) {
  //                     if (error.code === 'P2002') {
  //                         throw new ForbiddenException(
  //                             'Credentials Taken'
  //                         )
  //                     }
  //                 }
  //                 throw new ForbiddenException(
  //                     'There has been an error. Please check the inputs and try again.'
  //                 )
  //             }
  //         }
  //     } else {
  //         throw new ForbiddenException(
  //             'Please register your name first.'
  //         )
  //     }
  // }

  // async uploadCover(image: Express.Multer.File, user: User) {
  //     const profile = await this.prisma.profile.findFirst({
  //         where: {
  //             user_id: user.id,
  //         }
  //     })

  //     const name = image.path.split('\\');

  //     if (profile) {
  //         if (profile.cover_image == 'null' || profile.cover_image == null) {
  //             try {
  //                 const newProfile = await this.prisma.profile.update({
  //                     where: {
  //                         id: profile.id,
  //                     },
  //                     data: {
  //                         cover_image: name[3]
  //                     },
  //                 });

  //                 if (newProfile) {
  //                     return newProfile;
  //                 } else {
  //                     throw new ForbiddenException(
  //                         'There has been an error. Please check the inputs and try again.'
  //                     )
  //                 }
  //             } catch (error) {
  //                 if (error instanceof PrismaClientKnownRequestError) {
  //                     if (error.code === 'P2002') {
  //                         throw new ForbiddenException(
  //                             'Credentials Taken'
  //                         )
  //                     }
  //                 }
  //                 throw new ForbiddenException(
  //                     'There has been an error. Please check the inputs and try again.'
  //                 )
  //             }
  //         } else {
  //             const oldImage = profile.cover_image;

  //             try {
  //                 const newProfile = await this.prisma.profile.update({
  //                     where: {
  //                         id: profile.id,
  //                     },
  //                     data: {
  //                         cover_image: name[3]
  //                     },
  //                 });

  //                 if (newProfile) {
  //                     fs.unlink("./uploads/profile/cover/" + oldImage, (err) => {
  //                         if (err) {
  //                             console.error(err)
  //                             return
  //                         }
  //                     })
  //                     return newProfile;
  //                 } else {
  //                     throw new ForbiddenException(
  //                         'There has been an error. Please check the inputs and try again.'
  //                     )
  //                 }
  //             } catch (error) {
  //                 if (error instanceof PrismaClientKnownRequestError) {
  //                     if (error.code === 'P2002') {
  //                         throw new ForbiddenException(
  //                             'Credentials Taken'
  //                         )
  //                     }
  //                 }
  //                 throw new ForbiddenException(
  //                     'There has been an error. Please check the inputs and try again.'
  //                 )
  //             }
  //         }
  //     } else {
  //         throw new ForbiddenException(
  //             'Please register your name first.'
  //         )
  //     }
  // }
}
