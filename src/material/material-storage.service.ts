/* eslint-disable prefer-const */
import { ForbiddenException, Injectable, Logger, Res } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class MaterialStorageService {
  private readonly logger = new Logger(MaterialStorageService.name);

  constructor(private prisma: PrismaService) {}

  async createFile(images, id: number) {
    this.logger.debug('createFile images received');
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
    const image =
      images['images'][0].path.split('/')[
        images['images'][0].path.split('/').length - 1
      ];

    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
      include: {
        material_image: true,
        material_preview: true,
      },
    });

    if (material) {
      try {
        await this.prisma.material.update({
          data: {
            material: m_name,
          },
          where: {
            id: id,
          },
        });

        await this.prisma.materialImage.create({
          data: {
            image: p_name,
            primary: true,
            material_id: material.id,
          },
        });

        await this.prisma.materialImage.create({
          data: {
            image: c_name,
            cover: true,
            material_id: material.id,
          },
        });

        await this.prisma.previewMaterial.create({
          data: {
            preview: pr_name,
            material_id: material.id,
          },
        });

        await this.prisma.materialImage.create({
          data: {
            image: image,
            material_id: material.id,
          },
        });

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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const m_name = materialFile['material'][0].path.split('\\');

      if (m_name != null) {
        try {
          const oldMaterial = material.material;

          const newMaterial = await this.prisma.material.update({
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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const p_name = materialProfile['profile'][0].path.split('\\');

      if (p_name != null) {
        const matImg = await this.prisma.materialImage.findFirst({
          where: {
            material_id: material.id,
            primary: true,
          },
        });

        if (matImg) {
          try {
            const oldMaterial = matImg.image;

            const newMaterial = await this.prisma.materialImage.update({
              where: {
                id: matImg.id,
              },
              data: {
                image: p_name[2],
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
          const newMaterial = await this.prisma.materialImage.create({
            data: {
              image: p_name[2],
              primary: true,
              material_id: material.id,
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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const c_name = materialCover['cover'][0].path.split('\\');

      if (c_name != null) {
        const matImg = await this.prisma.materialImage.findFirst({
          where: {
            material_id: material.id,
            cover: true,
          },
        });

        if (matImg) {
          try {
            const oldMaterial = matImg.image;

            const newMaterial = await this.prisma.materialImage.update({
              where: {
                id: matImg.id,
              },
              data: {
                image: c_name[2],
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
          const newMaterial = await this.prisma.materialImage.create({
            data: {
              image: c_name[2],
              cover: true,
              material_id: material.id,
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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const p_name = materialPreview['preview'][0].path.split('\\');

      if (p_name != null) {
        const matPrv = await this.prisma.previewMaterial.findFirst({
          where: {
            material_id: material.id,
          },
        });

        if (matPrv) {
          try {
            const oldMaterial = matPrv.preview;

            const newMaterial = await this.prisma.previewMaterial.update({
              where: {
                id: matPrv.id,
              },
              data: {
                preview: p_name[2],
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
          const newMaterial = await this.prisma.previewMaterial.create({
            data: {
              preview: p_name[2],
              material_id: material.id,
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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      const matI = await this.prisma.materialImage.findMany({
        where: {
          material_id: material.id,
          primary: false,
          cover: false,
        },
      });

      for await (let img of materialPreview['images']) {
        let name = img.path.split('\\');
        await this.prisma.materialImage.create({
          data: {
            image: name[2],
            material_id: material.id,
          },
        });
      }

      if (matI) {
        for await (let img of matI) {
          let i = img.image;
          const d = await this.prisma.materialImage.delete({
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
    const material = await this.prisma.material.findUnique({
      where: {
        id,
      },
    });

    const name = file.path.split('\\');

    if (material) {
      if (material.material == null || material.material == 'null') {
        try {
          const newMaterial = await this.prisma.material.update({
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
          const newMaterial = await this.prisma.material.update({
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
    const material = await this.prisma.material.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + material.material),
    );
  }

  async uploadMaterialProfile(file: Express.Multer.File, id: number) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
        primary: true,
      },
    });

    const name = file.path.split('\\');

    if (!materialImage) {
      try {
        const newMaterialProfile = await this.prisma.materialImage.create({
          data: {
            image: name[3],
            primary: true,
            material_id: id,
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
        const newMaterialImage = await this.prisma.materialImage.update({
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
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
        primary: true,
      },
    });

    return res.sendFile(
      join(process.cwd(), './uploads/material/' + materialImage.image),
    );
  }

  async uploadMaterialCover(file: Express.Multer.File, id: number) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
        cover: true,
      },
    });

    const name = file.path.split('\\');

    if (!materialImage) {
      try {
        const newMaterialCover = await this.prisma.materialImage.create({
          data: {
            image: name[3],
            cover: true,
            material_id: id,
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
        const newMaterialImage = await this.prisma.materialImage.update({
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

  async showMaterialCover(id: number, @Res() res) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
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
        const newMaterialImage = await this.prisma.materialImage.create({
          data: {
            image: name[3],
            material_id: id,
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
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + materialImage.image),
    );
  }

  async uploadMaterialPreview(file: Express.Multer.File, id: number) {
    const preview = await this.prisma.previewMaterial.findFirst({
      where: {
        material_id: id,
      },
    });

    const name = file.path.split('\\');

    if (preview) {
      if (preview.preview == null || preview.preview == 'null') {
        try {
          const newPreview = await this.prisma.previewMaterial.update({
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
          const newPreview = await this.prisma.previewMaterial.update({
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
      return await this.prisma.previewMaterial.create({
        data: {
          material_id: id,
          preview: name[3],
        },
      });
    }
  }

  async showMaterialPreview(id: number, @Res() res) {
    const preview = await this.prisma.previewMaterial.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + preview.preview),
    );
  }
}
