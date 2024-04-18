/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
import { Res } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMaterialDto } from './dto';
import { Material, Prisma, Type } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

@Injectable()
export class ChannelMaterialService {
  constructor(private prisma: PrismaService) {}

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
          // check if sub id is owned by user
          const addToSubPlan =
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

  async createFile(images, id: number) {
    const m_name =
      images['material'][0].path.split('/')[
        images['material'][0].path.split('/').length - 1
      ];

    const p_name =
      images['profile'][0].path.split('/')[
        images['profile'][0].path.split('/').length - 1
      ];

    const c_name =
      images['cover'][0].path.split('/')[
        images['cover'][0].path.split('/').length - 1
      ];

    const pr_name =
      images['preview'][0].path.split('/')[
        images['preview'][0].path.split('/').length - 1
      ];

    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
      },
    });
    if (material) {
      try {
        const matUpdate = await this.prisma.channelMaterial.update({
          data: {
            material: m_name,
          },
          where: {
            id: id,
          },
        });

        const addProfileImage = await this.prisma.channelMaterialImage.create({
          data: {
            image: p_name,
            primary: true,
            channel_material_id: material.id,
          },
        });

        const addCoverImage = await this.prisma.channelMaterialImage.create({
          data: {
            image: c_name,
            cover: true,
            channel_material_id: material.id,
          },
        });

        const addPreview = await this.prisma.channelPreviewMaterial.create({
          data: {
            preview: pr_name,
            channel_material_id: material.id,
          },
        });

        // for await (let img of images['images']) {
        //   let name = img.path.split('\\');
        //   let add = await this.prisma.channelMaterialImage.create({
        //     data: {
        //       image: name[3],
        //       channel_material_id: material.id,
        //     },
        //   });
        // }

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
    } else {
      throw new ForbiddenException(
        'The material not found. Please check your inputs.',
      );
    }
  }

  async findAll() {
    return await this.prisma.channelMaterial.findMany({
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async getMaterialByType(materialType: Type) {
    return await this.prisma.channelMaterial.findMany({
      where: {
        type: materialType,
      },
      orderBy: {
        first_published_at: 'desc',
      },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
  }

  async findOne(id: number) {
    try {
      //also add all associated data like images and preview
      const material = await this.prisma.channelMaterial.findUnique({
        where: {
          id: id,
        },
        include: {
          channel_material_image: true,
          channel_material_preview: true,
          material_in_subscription_plan: true,
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

  async findForSeller(id: number) {
    return await this.prisma.channelMaterial.findMany({
      where: {
        sellerProfile_id: id,
      },
      include: {
        channel_material_image: true,
        channel_material_preview: true,
        material_in_subscription_plan: true,
        rate: true,
        report: true,
      },
    });
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

  async updateMaterial(materialFile, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const m_name = materialFile['material'][0].path.split('\\');

      if (m_name != null) {
        try {
          const oldMaterial = material.material;

          const newMaterial = await this.prisma.channelMaterial.update({
            where: {
              id: material.id,
            },
            data: {
              material: m_name[3],
            },
          });

          if (newMaterial) {
            fs.unlink('./uploads/material/' + oldMaterial, (err) => {
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
            message: 'Material Updated Successfully',
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
        "Can't update while there is no material. Please create a material first.",
      );
    }
  }

  async updateMaterialProfile(materialProfile, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const m_name = materialProfile['material'][0].path.split('\\');

      if (m_name != null) {
        const matImg = await this.prisma.channelMaterialImage.findFirst({
          where: {
            channel_material_id: material.id,
            primary: true,
          },
        });

        if (matImg) {
          try {
            const oldMaterial = matImg.image;

            const newMaterial = await this.prisma.channelMaterialImage.update({
              where: {
                id: matImg.id,
              },
              data: {
                image: m_name[3],
              },
            });

            if (newMaterial) {
              fs.unlink('./uploads/material/' + oldMaterial, (err) => {
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
              message: 'Material Profile Updated Successfully',
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
        } else {
          const newMaterial = await this.prisma.channelMaterialImage.create({
            data: {
              image: m_name[3],
              primary: true,
              channel_material_id: material.id,
            },
          });

          if (newMaterial) {
            return {
              message: 'Material Profile Updated Successfully',
            };
          }
        }
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }
  }

  async updateMaterialCover(materialCover, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const m_name = materialCover['material'][0].path.split('\\');

      if (m_name != null) {
        const matImg = await this.prisma.channelMaterialImage.findFirst({
          where: {
            channel_material_id: material.id,
            cover: true,
          },
        });

        if (matImg) {
          try {
            const oldMaterial = matImg.image;

            const newMaterial = await this.prisma.channelMaterialImage.update({
              where: {
                id: matImg.id,
              },
              data: {
                image: m_name[3],
              },
            });

            if (newMaterial) {
              fs.unlink('./uploads/material/' + oldMaterial, (err) => {
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
              message: 'Material Profile Updated Successfully',
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
        } else {
          const newMaterial = await this.prisma.channelMaterialImage.create({
            data: {
              image: m_name[3],
              cover: true,
              channel_material_id: material.id,
            },
          });

          if (newMaterial) {
            return {
              message: 'Material Cover Updated Successfully',
            };
          }
        }
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }
  }

  async updateMaterialPreview(materialPreview, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const m_name = materialPreview['material'][0].path.split('\\');

      if (m_name != null) {
        const matPrv = await this.prisma.channelPreviewMaterial.findFirst({
          where: {
            channel_material_id: material.id,
          },
        });

        if (matPrv) {
          try {
            const oldMaterial = matPrv.preview;

            const newMaterial = await this.prisma.channelPreviewMaterial.update(
              {
                where: {
                  id: matPrv.id,
                },
                data: {
                  preview: m_name[3],
                },
              },
            );

            if (newMaterial) {
              fs.unlink('./uploads/material/' + oldMaterial, (err) => {
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
              message: 'Material Preview Updated Successfully',
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
        } else {
          const newMaterial = await this.prisma.channelPreviewMaterial.create({
            data: {
              preview: m_name[3],
              channel_material_id: material.id,
            },
          });

          if (newMaterial) {
            return {
              message: 'Material Preview Updated Successfully',
            };
          }
        }
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no material. Please create a material first.",
      );
    }
  }

  async updateMaterialImage(materialPreview, id: number) {
    const material = await this.prisma.channelMaterial.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const matI = await this.prisma.channelMaterialImage.findMany({
        where: {
          channel_material_id: material.id,
          primary: false,
          cover: false,
        },
      });

      for await (let img of material['images']) {
        let name = img.path.split('\\');
        let add = await this.prisma.channelMaterialImage.create({
          data: {
            image: name[3],
            channel_material_id: material.id,
          },
        });
      }

      if (matI) {
        for await (let img of matI) {
          var i = img.image;
          const d = await this.prisma.channelMaterialImage.delete({
            where: {
              id: img.id,
            },
          });
          if (d) {
            fs.unlink('./uploads/material/' + i, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
        }
      }

      return {
        message: 'Material Images Updated Successfully',
      };
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
      //remove all related data like file, images and preview
      try {
        const material = await this.prisma.channelMaterial.delete({
          where: {
            id: id,
          },
        });

        if (material) {
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

  async uploadMaterial(file: Express.Multer.File, id: number) {
    const material = await this.prisma.channelMaterial.findUnique({
      where: {
        id,
      },
    });

    const name = file.path.split('\\');

    if (material) {
      if (material.material == null || material.material == 'null') {
        try {
          const newMaterial = await this.prisma.channelMaterial.update({
            where: {
              id: id,
            },
            data: {
              material: name[3],
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
        const oldFile = material.material;

        try {
          const newMaterial = await this.prisma.channelMaterial.update({
            where: {
              id: id,
            },
            data: {
              material: name[3],
            },
          });

          if (newMaterial) {
            fs.unlink('./uploads/material/' + oldFile, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
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
      }
    } else {
      throw new ForbiddenException('Please register the title first.');
    }
  }

  async showMaterial(id: number, @Res() res) {
    const material = await this.prisma.channelMaterial.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/channel/material/' + material.material),
    );
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
        primary: true,
      },
    });

    const name = file.path.split('\\');

    if (!materialImage) {
      try {
        const newMaterialProfile =
          await this.prisma.channelMaterialImage.create({
            data: {
              image: name[3],
              primary: true,
              channel_material_id: id,
            },
          });

        if (newMaterialProfile) {
          return newMaterialProfile;
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
      const oldImage = materialImage.image;

      try {
        const newMaterialImage = await this.prisma.channelMaterialImage.update({
          where: {
            id: materialImage.id,
          },
          data: {
            image: name[3],
          },
        });

        if (newMaterialImage) {
          fs.unlink('./uploads/material/' + oldImage, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
          return newMaterialImage;
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

  async showMaterialProfile(id: number, @Res() res) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
      },
    });

    return res.sendFile(
      join(process.cwd(), './uploads/material/' + materialImage.image),
    );
  }

  async getMaterialCoverName(id: number) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
      },
    });

    return materialImage.image;
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
        cover: true,
      },
    });

    const name = file.path.split('\\');

    if (!materialImage) {
      try {
        const newMaterialCover = await this.prisma.channelMaterialImage.create({
          data: {
            image: name[3],
            cover: true,
            channel_material_id: id,
          },
        });

        if (newMaterialCover) {
          return newMaterialCover;
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
      const oldImage = materialImage.image;

      try {
        const newMaterialImage = await this.prisma.channelMaterialImage.update({
          where: {
            id: materialImage.id,
          },
          data: {
            image: name[3],
          },
        });

        if (newMaterialImage) {
          fs.unlink('./uploads/material/' + oldImage, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
          return newMaterialImage;
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

  async showMaterialCover(id: number, @Res() res) {
    const materialImage = await this.prisma.channelMaterialImage.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + materialImage.image),
    );
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    try {
      files.forEach(async (file) => {
        const name = file.path.split('\\');

        const newMaterialImage = await this.prisma.channelMaterialImage.create({
          data: {
            image: name[3],
            channel_material_id: id,
          },
        });

        if (!newMaterialImage) {
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

  async showMaterialImage(id: number, @Res() res) {
    const materialImage = await this.prisma.channelMaterialImage.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + materialImage.image),
    );
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    const preview = await this.prisma.channelPreviewMaterial.findFirst({
      where: {
        channel_material_id: id,
      },
    });

    const name = file.path.split('\\');

    if (preview) {
      if (preview.preview == null || preview.preview == 'null') {
        try {
          const newPreview = await this.prisma.channelPreviewMaterial.update({
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
          const newPreview = await this.prisma.channelPreviewMaterial.update({
            where: {
              id: preview.id,
            },
            data: {
              preview: name[3],
            },
          });

          if (newPreview) {
            fs.unlink('./uploads/material/' + oldFile, (err) => {
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
      return await this.prisma.channelPreviewMaterial.create({
        data: {
          channel_material_id: id,
          preview: name[3],
        },
      });
    }
  }

  async showMaterialPreview(id: number, @Res() res) {
    const preview = await this.prisma.channelPreviewMaterial.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + preview.preview),
    );
  }
}
