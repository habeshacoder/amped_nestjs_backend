/* eslint-disable prefer-const */
import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class ChannelMaterialStorageService {
  private readonly logger = new Logger(ChannelMaterialStorageService.name);

  constructor(private prisma: PrismaService) {}

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
        await this.prisma.channelMaterial.update({
          data: {
            material: m_name,
          },
          where: {
            id: id,
          },
        });

        await this.prisma.channelMaterialImage.create({
          data: {
            image: p_name,
            primary: true,
            channel_material_id: material.id,
          },
        });

        await this.prisma.channelMaterialImage.create({
          data: {
            image: c_name,
            cover: true,
            channel_material_id: material.id,
          },
        });

        await this.prisma.channelPreviewMaterial.create({
          data: {
            preview: pr_name,
            channel_material_id: material.id,
          },
        });

        for await (let img of images['images']) {
          let name = img.path.split('/');
          await this.prisma.channelMaterialImage.create({
            data: {
              image: name[name.length - 1],
              channel_material_id: material.id,
            },
          });
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
    } else {
      throw new ForbiddenException(
        'The material not found. Please check your inputs.',
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
                this.logger.error(err);
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
                  this.logger.error(err);
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
                  this.logger.error(err);
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
                  this.logger.error(err);
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

      for await (let img of materialPreview['images']) {
        let name = img.path.split('\\');
        await this.prisma.channelMaterialImage.create({
          data: {
            image: name[3],
            channel_material_id: material.id,
          },
        });
      }

      if (matI) {
        for await (let img of matI) {
          let i = img.image;
          const d = await this.prisma.channelMaterialImage.delete({
            where: {
              id: img.id,
            },
          });
          if (d) {
            fs.unlink('./uploads/material/' + i, (err) => {
              if (err) {
                this.logger.error(err);
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
                this.logger.error(err);
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
              this.logger.error(err);
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
      const oldImage = materialImage.image;

      try {
        const newMaterialCover = await this.prisma.channelMaterialImage.update({
          where: {
            id: materialImage.id,
          },
          data: {
            image: name[3],
          },
        });

        if (newMaterialCover) {
          fs.unlink('./uploads/material/' + oldImage, (err) => {
            if (err) {
              this.logger.error(err);
              return;
            }
          });
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
    }
  }

  async showMaterialCover(id: number, @Res() res) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
      where: {
        channel_material_id: id,
        cover: true,
      },
    });

    return res.sendFile(
      join(process.cwd(), './uploads/material/' + materialImage.image),
    );
  }

  async uploadMaterialImage(files: Array<Express.Multer.File>, id: number) {
    const uploadedImages = [];
    for (const file of files) {
      const name = file.path.split('\\');
      try {
        const newMaterialImage = await this.prisma.channelMaterialImage.create({
          data: {
            image: name[3],
            channel_material_id: id,
          },
        });
        if (newMaterialImage) {
          uploadedImages.push(newMaterialImage);
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
    return uploadedImages;
  }

  async showMaterialImage(id: number, @Res() res) {
    const materialImage = await this.prisma.channelMaterialImage.findFirst({
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
                this.logger.error(err);
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
