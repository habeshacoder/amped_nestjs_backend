/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { SocialLinksProfileDto } from './dto';

@Injectable()
export class SocialLinksProfileService {
    constructor (
        private prisma: PrismaService,
    ) {}

    async create(socialLinksProfileDto: SocialLinksProfileDto) {
        try {
            const link = await this.prisma.socialLinksProfile.create({
                data: {
                    // name: socialLinksProfileDto.name,
                    // description: socialLinksProfileDto.description,
                    link: socialLinksProfileDto.link,
                    sellerProfile_id: socialLinksProfileDto.sellerProfile_id,
                }
            });

            if (link) {
                return link;
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException (
                        'Credentials Taken'
                    )
                }
            }
            throw new ForbiddenException (
                'There has been an error. Please check the inputs and try again.'
            )
        }
        return 'This action adds a new socialLinksProfile';
    }

    async findAll() {
        return await this.prisma.socialLinksProfile.findMany();
    }

    async findOne(id: number) {
        return await this.prisma.socialLinksProfile.findUnique({
            where: {
                id,
            }
        });
    }

    async getSellerSocialLinks(seller_id : number) {
        const socialLinks = await this.prisma.socialLinksProfile.findMany({
            where: {
                sellerProfile_id: seller_id
            },
            orderBy: {
                id: 'asc'
            }
        })

        if(socialLinks) {
            return socialLinks
        } else {
            return {
                "message" : "No Seller Social Account Link With This Accoount"
            }
        }
    }

    async update(id: number, socialLinksProfileDto: SocialLinksProfileDto) {
        try {
            const newLink = await this.prisma.socialLinksProfile.update({
                where: {
                    id: id,
                },
                data: {
                    // name: socialLinksProfileDto.name,
                    // description: socialLinksProfileDto.description,
                    link: socialLinksProfileDto.link,
                },
            });

            if (newLink) {
                return newLink;
            } else {
                throw new ForbiddenException (
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } catch(error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException (
                        'Credentials Taken'
                    )
                }
            }
            throw new ForbiddenException (
                'There has been an error. Please check the inputs and try again.'
            )
        }
    }

    async remove(id: number) {
        try {
            const link = await this.prisma.socialLinksProfile.delete({
                where: {
                    id: id,
                }
            });

            if (link) {
                return {'message': "Social link deleted successfully"};
            } else {
                throw new ForbiddenException (
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } catch(error) {
            throw new ForbiddenException (
                'There has been an error. Please check the inputs and try again.'
            )
        }
    }
}
