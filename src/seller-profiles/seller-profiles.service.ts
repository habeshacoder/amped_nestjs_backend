/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { SellerProfileDto } from './dto';
import { PrismaService } from "../prisma/prisma.service";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { User } from '@prisma/client';
const fs = require('fs');

@Injectable()
export class SellerProfilesService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async create(images, sellerProfileDto: SellerProfileDto, user: User) {
        const p_name = images["image"][0].path.split('\\');
        const c_name = images["cover"][0].path.split('\\');

        try {
            const sProfile = await this.prisma.sellerProfile.create({
                data: {
                    name: sellerProfileDto.name,
                    description: sellerProfileDto.description,
                    sex: sellerProfileDto.sex,
                    date_of_birth: sellerProfileDto.date_of_birth,
                    image: p_name[3],
                    cover_image: c_name[3],
                    user_id: user.id,
                },
            });

            if (sProfile) {
                return sProfile;
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException(
                        'Credentials Taken'
                    )
                }
            }
            throw new ForbiddenException(
                'There has been an error. Please check the inputs and try again.'
            )
        }
    }

    async findAll() {
        return await this.prisma.sellerProfile.findMany()
    }

    async findOne(id: number) {
        if (!Number.isNaN(id) && id != null) {
            try {
                return await this.prisma.sellerProfile.findUnique({
                    where: {
                        id,
                    },
                    include: {
                        social_links_profile: true
                    }
                })
            } catch (error) {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException(
                            'Credentials Taken'
                        )
                    }
                }
                throw new ForbiddenException(
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } else {
            throw new ForbiddenException(
                'There is no profile. Please create a profile first.'
            )
        }
    }

    async findMe(user: User) {
        const sellerProfile = await this.prisma.sellerProfile.findMany({
            where: {
                user_id: user.id,
            },
            include: {
                social_links_profile: true
            }
        })

        if (sellerProfile) {
            return sellerProfile;
        } else {
            return { 'message': 'No seller profile found.' }
        }
    }

    async updateProfileInfo(id: number, sellerProfileDto: SellerProfileDto) {
        const sProfile = await this.prisma.sellerProfile.findFirst({
            where: {
                id: id,
            }
        })

        if (sProfile) {

            try {
                const newProfile = await this.prisma.sellerProfile.update({
                    where: {
                        id: id,
                    },
                    data: {
                        name: sellerProfileDto.name,
                        description: sellerProfileDto.description,
                        sex: sellerProfileDto.sex,
                        date_of_birth: sellerProfileDto.date_of_birth,
                    },
                });

                if (newProfile) {
                    return newProfile;
                } else {
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            } catch (error) {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException(
                            'Credentials Taken'
                        )
                    }
                }
                throw new ForbiddenException(
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } else {
            throw new ForbiddenException(
                'Can\'t update while there is no profile. Please create a profile first.'
            )
        }
    }

    async updateProfileImage(profileImage, id: number) {
        const sProfile = await this.prisma.sellerProfile.findFirst({
            where: {
                id: id,
            }
        })

        if (sProfile) {

            const p_name = profileImage["image"][0].path.split('\\');

            if (p_name != null) {
                try {
                    const oldImage = sProfile.image;

                    const newProfile = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            image: p_name[3]
                        },
                    });

                    if (newProfile) {
                        fs.unlink("./uploads/sellerProfile/image" + oldImage, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })

                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }

                    return {
                        "message": "Profile Image Uploaded Successfully"
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            }
        } else {
            throw new ForbiddenException(
                'Can\'t update while there is no profile. Please create a profile first.'
            )
        }
    }

    async updateCoverImage(coverImage, id: number) {
        const sProfile = await this.prisma.sellerProfile.findFirst({
            where: {
                id: id,
            }
        })

        if (sProfile) {

            const c_name = coverImage["cover"][0].path.split('\\');

            if (c_name != null) {
                try {
                    const oldCImage = sProfile.cover_image;

                    const newCover = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            cover_image: c_name[3]
                        },
                    });

                    if (newCover) {
                        fs.unlink("./uploads/sellerProfile/image" + oldCImage, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })

                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }

                    return {
                        "message": "Cover Image Uploaded Successfully"
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            }
        } else {
            throw new ForbiddenException(
                'Can\'t update while there is no profile. Please create a profile first.'
            )
        }
    }

    async remove(id: number) {
        const sProfile = await this.prisma.sellerProfile.findFirst({
            where: {
                id: id,
            }
        })

        if (sProfile) {
            const image = sProfile.image;
            const cover = sProfile.cover_image;
            try {
                const dsprofile = await this.prisma.sellerProfile.delete({
                    where: {
                        id: id,
                    }
                });

                if (dsprofile) {
                    if (image != 'null') {
                        fs.unlink("./uploads/sellerProfile/image/" + image, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                    }
                    if (cover != 'null') {
                        fs.unlink("./uploads/sellerProfile/image/" + cover, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                    }
                    return { 'message': "Seller Profile deleted successfully" };
                }
            } catch (error) {
                throw new ForbiddenException(
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } else {
            throw new ForbiddenException(
                'Can\'t delete while there is no profile. Please create a profile first.'
            )
        }
    }

    async uploadImage(image: Express.Multer.File, id: number) {
        const sProfile = await this.prisma.sellerProfile.findUnique({
            where: {
                id,
            }
        })

        const name = image.path.split('\\');

        if (sProfile) {
            if (sProfile.image == 'null') {
                try {
                    const newProfile = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            image: name[3]
                        },
                    });

                    if (newProfile) {
                        return newProfile;
                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            } else {
                const oldImage = sProfile.image;

                try {
                    const newProfile = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            image: name[3]
                        },
                    });

                    if (newProfile) {
                        fs.unlink("./uploads/sellerProfile/image/" + oldImage, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                        return newProfile;
                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            }
        } else {
            throw new ForbiddenException(
                'Please fill the name first.'
            )
        }
    }

    async uploadCover(image: Express.Multer.File, id: number) {
        const sProfile = await this.prisma.sellerProfile.findUnique({
            where: {
                id,
            }
        })

        const name = image.path.split('\\');

        if (sProfile) {
            if (sProfile.cover_image == 'null') {
                try {
                    const newProfile = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            cover_image: name[3]
                        },
                    });

                    if (newProfile) {
                        return newProfile;
                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            } else {
                const oldImage = sProfile.cover_image;

                try {
                    const newProfile = await this.prisma.sellerProfile.update({
                        where: {
                            id: sProfile.id,
                        },
                        data: {
                            cover_image: name[3]
                        },
                    });

                    if (newProfile) {
                        fs.unlink("./uploads/sellerProfile/image/" + oldImage, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                        })
                        return newProfile;
                    } else {
                        throw new ForbiddenException(
                            'There has been an error. Please check the inputs and try again.'
                        )
                    }
                } catch (error) {
                    if (error instanceof PrismaClientKnownRequestError) {
                        if (error.code === 'P2002') {
                            throw new ForbiddenException(
                                'Credentials Taken'
                            )
                        }
                    }
                    throw new ForbiddenException(
                        'There has been an error. Please check the inputs and try again.'
                    )
                }
            }
        } else {
            throw new ForbiddenException(
                'Please fill the name first.'
            )
        }
    }
}
