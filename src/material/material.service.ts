/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
import { Req, Res } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialDto } from './dto';
import { Catagory, Material, Parent, Prisma, Type, User } from '@prisma/client';
import { ReadStream } from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
let fs = require('fs');

@Injectable()
export class MaterialService {
  private stream: ReadStream;
  private seekPosition = 0;

  constructor(private prisma: PrismaService) {}

  async create(materialDto: MaterialDto) {
    try {
      const material = await this.prisma.material.create({
        data: {
          parent: materialDto.parent,
          type: materialDto.type,
          genere: materialDto.genere,
          catagory: materialDto.catagory,
          title: materialDto.title,
          description: materialDto.description,
          price: materialDto.price,
          material: 'null',
          author: materialDto.author,
          reader: materialDto.reader,
          translator: materialDto.translator,
          length_minute: materialDto.length_minute,
          length_page: materialDto.length_page,
          first_published_at: materialDto.first_published_at.toString(),
          language: materialDto.language,
          publisher: materialDto.publisher,
          episode: materialDto.episode,
          continues_from: materialDto.continues_from,
          sellerProfile_id: materialDto.sellerProfile_id,
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
  }

  async createFile(images, id: number) {
    console.log('images/////////:', images);
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
        const matUpdate = await this.prisma.material.update({
          data: {
            material: m_name,
          },
          where: {
            id: id,
          },
        });

        const addProfileImage = await this.prisma.materialImage.create({
          data: {
            image: p_name,
            primary: true,
            material_id: material.id,
          },
        });

        const addCoverImage = await this.prisma.materialImage.create({
          data: {
            image: c_name,
            cover: true,
            material_id: material.id,
          },
        });

        const addPreview = await this.prisma.previewMaterial.create({
          data: {
            preview: pr_name,
            material_id: material.id,
          },
        });
        console.log(
          'before let img of images',
          m_name,
          p_name,
          c_name,
          pr_name,
        );

        let add = await this.prisma.materialImage.create({
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

  async findAll() {
    return await this.prisma.material.findMany({
      include: {
        material_image: true,
        material_preview: true,
        material_user: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
      },
    });
  }

  async getHomeItems() {}

  async getMaterialByType(materialType: Type) {
    const mat = await this.prisma.material.findMany({
      where: {
        type: materialType,
      },
      include: {
        material_image: true,
        material_preview: true,
        // wish_list: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
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
        // wish_list: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
      },
    });

    // const shuffledElements = mat.sort(() => 0.5 - Math.random());
    // return shuffledElements.slice(0, 3);
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
        // wish_list: true,
        material_user: true,
        // unfinishedOrderDetails: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
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
        // wish_list: true,
        material_user: true,
        // unfinishedOrderDetails: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
      },
    });

    return mat;
  }

  async paginateMaterialByType(
    materialType,
    params: { take?: number; page?: number },
  ) {
    const { take, page } = params;

    let skip = null;
    const getMaterial = await this.prisma.material.findMany({
      where: {
        type: materialType,
      },
    });
    const num_of_material = getMaterial.length;
    const totalPages = Math.ceil(num_of_material / take); // round up decimal point totalPages value

    if (page >= 0 && page < totalPages) {
      skip = take * page;
    } else {
      throw new ForbiddenException('Page Not Found');
    }

    let previousPage = page - 1;
    let nextPage = page + 1;
    const lastPage = totalPages - 1;

    let material_in_last_page = num_of_material % take;
    if (material_in_last_page == 0) material_in_last_page = take;

    if (page == 0) previousPage = null;
    if (nextPage >= totalPages) nextPage = null;

    const meta = {
      Num_Of_Materials: num_of_material,
      Num_Of_Pages: totalPages,
      Per_Page: take,
      Materials_In_last_page: material_in_last_page,
      self: page,
      prev: previousPage,
      next: nextPage,
      last: lastPage,
      Links: [
        {
          first:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            0,
        },
        {
          self:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            page,
        },
        {
          prev:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            previousPage,
        },
        {
          next:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            nextPage,
        },
        {
          last:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            lastPage,
        },
      ],
    };

    //console.log('Meta: ', meta.Links);

    const materials = await this.prisma.material.findMany({
      take,
      skip,
      where: {
        type: materialType,
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        material_image: true,
        material_preview: true,
        // wish_list: true,
        material_user: true,
        // unfinishedOrderDetails: true,
        rate: true,
        report: true,
        // special_price: true,
        // ewenet_special_price: true
      },
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsWeb(params: { take?: number; page?: number }) {
    const { take, page } = params;

    let skip = null;
    const num_of_material = await this.prisma.material.count();
    console.log('Material Count: ', num_of_material);
    const totalPages = Math.ceil(num_of_material / take); // round up decimal point totalPages value

    if (page >= 0 && page < totalPages) {
      skip = take * page;
    } else {
      throw new ForbiddenException('Page Not Found');
    }

    let previousPage = page - 1;
    let nextPage = page + 1;
    const lastPage = totalPages - 1;

    let material_in_last_page = num_of_material % take;
    if (material_in_last_page == 0) material_in_last_page = take;

    if (page == 0) previousPage = null;
    if (nextPage >= totalPages) nextPage = null;

    const meta = {
      Num_Of_Materials: num_of_material,
      Num_Of_Pages: totalPages,
      Per_Page: take,
      Materials_In_last_page: material_in_last_page,
      Links: [
        {
          first:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            0,
        },
        {
          self:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            page,
        },
        {
          prev:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            previousPage,
        },
        {
          next:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            nextPage,
        },
        {
          last:
            'http://localhost:3007/material/materials_web?take=' +
            take +
            '&page=' +
            lastPage,
        },
      ],
    };

    //console.log('Meta: ', meta.Links);

    const materials = await this.prisma.material.findMany({
      take,
      skip,
      orderBy: {
        id: 'desc',
      },
    });

    return { Materials: materials, Meta: meta };
  }

  async getMaterialsMob(params: { take?: number }): Promise<Material[]> {
    const { take } = params;

    let lastMaterialId = 0;

    const count = await this.prisma.material.findMany({
      orderBy: { id: 'desc' },
    });

    // eslint-disable-next-line prefer-const
    for (let x of count) {
      lastMaterialId = x['id'];
      break;
    }

    const cursor: Prisma.MaterialWhereUniqueInput = {
      id: Number(lastMaterialId),
    };

    return await this.prisma.material.findMany({
      cursor,
      take,
      //skip: 1,
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    try {
      //also add all associated data like images and preview
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
    const { take, page } = params;

    let skip = null;
    const getMaterial = await this.prisma.material.findMany({
      where: {
        sellerProfile_id: seller_id,
      },
    });
    const num_of_material = getMaterial.length;
    const totalPages = Math.ceil(num_of_material / take); // round up decimal point totalPages value

    if (page >= 0 && page < totalPages) {
      skip = take * page;
    } else {
      throw new ForbiddenException('Page Not Found');
    }

    let previousPage = page - 1;
    let nextPage = page + 1;
    const lastPage = totalPages - 1;

    let material_in_last_page = num_of_material % take;
    if (material_in_last_page == 0) material_in_last_page = take;

    if (page == 0) previousPage = null;
    if (nextPage >= totalPages) nextPage = null;

    const meta = {
      self: page,
      prev: previousPage,
      next: nextPage,
      last: lastPage,
    };

    //console.log('Meta: ', meta.Links);

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
        // wish_list: true,
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

    const shuffledElements = myMaterials.sort(() => 0.5 - Math.random());
    return shuffledElements.slice(0, 6);
  }

  async update(id: number, materialDto: MaterialDto) {
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      try {
        const newMaterial = await this.prisma.material.update({
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
            price: materialDto.price,
            author: materialDto.author,
            reader: materialDto.reader,
            translator: materialDto.translator,
            length_minute: materialDto.length_minute,
            length_page: materialDto.length_page,
            first_published_at: materialDto.first_published_at.toString(),
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
        const coverImg = await this.prisma.materialImage.findFirst({
          where: {
            material_id: material.id,
            cover: true,
          },
        });

        if (coverImg) {
          try {
            const oldMaterial = coverImg.image;

            const newMaterial = await this.prisma.materialImage.update({
              where: {
                id: coverImg.id,
              },
              data: {
                image: c_name[2],
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
              message: 'Material Cover Updated Successfully',
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
      const pm_name = materialPreview['preview'][0].path.split('\\');

      if (pm_name != null) {
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
                preview: pm_name[2],
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
              preview: pm_name[2],
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
        let add = await this.prisma.materialImage.create({
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
    const material = await this.prisma.material.findFirst({
      where: {
        id: id,
      },
    });

    if (material) {
      //remove all related data like file, images and preview
      try {
        const material = await this.prisma.material.delete({
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
    const material = await this.prisma.material.findUnique({
      where: {
        id,
      },
    });

    return res.sendFile(
      join(process.cwd(), 'uploads/material/' + material.material),
    );
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
            // wish_list: true,
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

    if (userMaterial) {
      return true;
    } else {
      return false;
    }
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
      //delete existing and upload new
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
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
      },
    });

    return res.sendFile(
      join(process.cwd(), './uploads/material/' + materialImage.image),
    );
  }

  async getMaterialCoverName(id: number) {
    const materialImage = await this.prisma.materialImage.findFirst({
      where: {
        material_id: id,
      },
    });

    return materialImage.image;
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
      //delete existing and upload new
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
    const materialImage = await this.prisma.materialImage.findUnique({
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

        const newMaterialImage = await this.prisma.materialImage.create({
          data: {
            image: name[3],
            material_id: id,
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
    const materialImage = await this.prisma.materialImage.findUnique({
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
