/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
import { Catch, ForbiddenException, Injectable, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelDto } from './dto';
const fs = require('fs');

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async create(images, channelDto: ChannelDto) {
    const p_name =
      images['profile'][0].path.split('/')[
        images['profile'][0].path.split('/').length - 1
      ];

    const c_name =
      images['cover'][0].path.split('/')[
        images['cover'][0].path.split('/').length - 1
      ];
    const seller = parseInt(channelDto.sellerProfile_id);

    try {
      const channel = await this.prisma.channel.create({
        data: {
          name: channelDto.name,
          description: channelDto.description,
          sellerProfile_id: seller,
        },
      });

      if (channel) {
        const newChannelPImage = await this.prisma.channelImage.create({
          data: {
            image: p_name,
            primary: true,
            channel_id: channel.id,
          },
        });

        const newChannelCImage = await this.prisma.channelImage.create({
          data: {
            image: c_name,
            cover: true,
            channel_id: channel.id,
          },
        });

        return channel;
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
  }

  async findAll() {
    const chann = await this.prisma.channel.findMany({
      // where: {
      //   draft: false,
      // },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });
    console.log('chann:--------', chann);
    const shuffledElements = chann.sort(() => 0.5 - Math.random());
    return shuffledElements.slice(0, 3);
  }

  async paginateChannels(params: { take?: number; page?: number }) {
    const { take, page } = params;

    let skip = null;
    const num_of_channel = await this.prisma.channel.count();
    const totalPages = Math.ceil(num_of_channel / take); // round up decimal point totalPages value

    if (page >= 0 && page < totalPages) {
      skip = take * page;
    } else {
      throw new ForbiddenException('Page Not Found');
    }

    let previousPage = page - 1;
    let nextPage = page + 1;
    const lastPage = totalPages - 1;

    let channels_in_last_page = num_of_channel % take;
    if (channels_in_last_page == 0) channels_in_last_page = take;

    if (page == 0) previousPage = null;
    if (nextPage >= totalPages) nextPage = null;

    const meta = {
      Num_Of_Channels: num_of_channel,
      Num_Of_Pages: totalPages,
      Per_Page: take,
      Channels_In_last_page: channels_in_last_page,
      self: page,
      prev: previousPage,
      next: nextPage,
      last: lastPage,
    };

    //console.log('Meta: ', meta.Links);

    const channels = await this.prisma.channel.findMany({
      take,
      skip,
      orderBy: {
        id: 'desc',
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });

    return { Materials: channels, Meta: meta };
  }
  async findOne(id: number) {
    if (id != null && id != undefined) {
      try {
        //also add all associated data like images and preview
        const channel = await this.prisma.channel.findUnique({
          where: {
            id,
          },
          include: {
            channel_image: true,
            channel_preview: true,
            social_links_channel: true,
            subscription_plan: true,
            rate: true,
            report: true,
          },
        });

        if (channel) {
          return channel;
        } else {
          return { message: 'Channel Not Found!!!' };
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
    } else {
      return { message: 'Channel Not Found!!!' };
    }
  }

  async getMyChannels(sellerId: number) {
    const myChannels = await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: sellerId,
        draft: false,
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });

    const shuffledElements = myChannels.sort(() => 0.5 - Math.random());
    return shuffledElements.slice(0, 6);
  }

  async newChannels() {
    const newChannels = await this.prisma.channel.findMany({
      where: {
        draft: false,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findForSeller(id: number) {
    return await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: id,
        draft: false,
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async findDraftForSeller(id: number) {
    return await this.prisma.channel.findMany({
      where: {
        sellerProfile_id: id,
        draft: true,
      },
      include: {
        channel_image: true,
        channel_preview: true,
        social_links_channel: true,
        subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async update(id: number, channelDto: ChannelDto) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: id,
      },
    });

    const seller = parseInt(channelDto.sellerProfile_id);
    if (channel) {
      try {
        const newChannel = await this.prisma.channel.update({
          where: {
            id: id,
          },
          data: {
            name: channelDto.name,
            description: channelDto.description,
            sellerProfile_id: seller,
          },
        });

        if (newChannel) {
          return newChannel;
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

  async updateChannelProfileImage(profileImage, channel_id: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channel_id,
      },
    });

    if (channel) {
      const channelProfile = await this.prisma.channelImage.findFirst({
        where: {
          channel_id: channel.id,
          primary: true,
        },
      });

      if (channelProfile) {
        const p_name = profileImage['profile'][0].path.split('\\');

        if (p_name != null) {
          try {
            const oldImage = channelProfile.image;

            const newChannelProfile = await this.prisma.channelImage.update({
              where: {
                id: channelProfile.id,
              },
              data: {
                image: p_name[2],
              },
            });

            if (newChannelProfile) {
              fs.unlink('./uploads/channel/' + oldImage, (err) => {
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
              message: 'Channel Profile Updated Successfully',
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
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no channel. Please create a channel first.",
      );
    }
  }

  async updateChannelCoverImage(coverImage, channel_id: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: channel_id,
      },
    });

    if (channel) {
      const channelCover = await this.prisma.channelImage.findFirst({
        where: {
          channel_id: channel.id,
          cover: true,
        },
      });

      if (channelCover) {
        const c_name = coverImage['cover'][0].path.split('\\');

        if (c_name != null) {
          try {
            const oldImage = channelCover.image;

            const newCoverImage = await this.prisma.channelImage.update({
              where: {
                id: channelCover.id,
              },
              data: {
                image: c_name[2],
              },
            });

            if (newCoverImage) {
              fs.unlink('./uploads/channel/' + oldImage, (err) => {
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
              message: 'Channel Cover Image Updated Successfully',
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
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no channel. Please create a channel first.",
      );
    }
  }

  async remove(id: number) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id: id,
      },
    });

    if (channel) {
      //remove all related data like file, images and preview
      try {
        const channel = await this.prisma.channel.delete({
          where: {
            id: id,
          },
        });

        if (channel) {
          return { message: 'Channel deleted successfully' };
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

  async uploadChannelProfile(file: Express.Multer.File, id: number) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: {
        channel_id: id,
        primary: true,
      },
    });

    const name = file.path.split('\\');

    if (!channelImage) {
      try {
        const newChannelProfile = await this.prisma.channelImage.create({
          data: {
            image: name[3],
            primary: true,
            channel_id: id,
          },
        });

        if (newChannelProfile) {
          return newChannelProfile;
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
      //delete existing and upload new
      const oldImage = channelImage.image;

      try {
        const newChannelImage = await this.prisma.channelImage.update({
          where: {
            id: channelImage.id,
          },
          data: {
            image: name[3],
          },
        });

        if (newChannelImage) {
          fs.unlink('./uploads/channel/profile/' + oldImage, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
          return newChannelImage;
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
    }
  }

  async showChannelProfile(channelId: number, @Res() res) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: {
        channel_id: channelId,
        primary: true,
      },
    });

    if (channelImage) {
      return res.sendFile(
        join(process.cwd(), 'uploads/channel/' + channelImage.image),
      );
    } else {
      throw new ForbiddenException(
        'There has been an error. Please check the inputs and try again.',
      );
    }
  }

  async uploadChannelCover(file: Express.Multer.File, id: number) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: {
        channel_id: id,
        cover: true,
      },
    });

    const name = file.path.split('\\');

    if (!channelImage) {
      try {
        const newChannelCover = await this.prisma.channelImage.create({
          data: {
            image: name[3],
            cover: true,
            channel_id: id,
          },
        });

        if (newChannelCover) {
          return newChannelCover;
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
      //delete existing and upload new
      const oldImage = channelImage.image;

      try {
        const newChannelImage = await this.prisma.channelImage.update({
          where: {
            id: channelImage.id,
          },
          data: {
            image: name[3],
          },
        });

        if (newChannelImage) {
          fs.unlink('./uploads/channel/cover/' + oldImage, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
          return newChannelImage;
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
    }
  }

  async showChannelCover(id: number, @Res() res) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: {
        channel_id: id,
        cover: true,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/channel/' + channelImage.image),
    );
  }

  async uploadChannelImage(files: Array<Express.Multer.File>, id: number) {
    try {
      files.forEach(async (file) => {
        const name = file.path.split('\\');

        const newChannelImage = await this.prisma.channelImage.create({
          data: {
            image: name[3],
            channel_id: id,
          },
        });

        if (!newChannelImage) {
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      });

      return { message: 'upload was successful.' };
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

  async showChannelImage(id: number, @Res() res) {
    const channelImage = await this.prisma.channelImage.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/channel/images/' + channelImage.image),
    );
  }

  async getChannelCoverImageName(channel_id: number) {
    const channelImage = await this.prisma.channelImage.findFirst({
      where: {
        channel_id: channel_id,
        primary: true,
      },
    });

    return channelImage.image;
  }

  async uploadChannelPreview(file: Express.Multer.File, id: number) {
    const preview = await this.prisma.previewChannel.findFirst({
      where: {
        channel_id: id,
      },
    });

    const name = file.path.split('\\');

    if (preview) {
      if (preview.preview == null || preview.preview == 'null') {
        try {
          const newPreview = await this.prisma.previewChannel.update({
            where: {
              id: preview.id,
            },
            data: {
              preview: name[3],
            },
          });

          if (newPreview) {
            return newPreview;
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
        const oldFile = preview.preview;

        try {
          const newPreview = await this.prisma.previewChannel.update({
            where: {
              id: preview.id,
            },
            data: {
              preview: name[3],
            },
          });

          if (newPreview) {
            fs.unlink('./uploads/channel/preview/' + oldFile, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
            return newPreview;
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
      }
    } else {
      //create new preview channel
      return await this.prisma.previewChannel.create({
        data: {
          channel_id: id,
          preview: name[3],
        },
      });
    }
  }

  async showChannelPreview(id: number, @Res() res) {
    const preview = await this.prisma.previewChannel.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/channel/preview/' + preview.preview),
    );
  }
}
