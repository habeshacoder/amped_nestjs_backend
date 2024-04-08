import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocialLinksChannelDto } from './dto';

@Injectable()
export class SocialLinksChannelService {
    constructor (
        private prisma: PrismaService,
    ) {}

    async create(socialLinksChannelDto: SocialLinksChannelDto) {
        try {
            const link = await this.prisma.socialLinksChannel.create({
                data: {
                    // name: socialLinksChannelDto.name,
                    // description: socialLinksChannelDto.description,
                    link: socialLinksChannelDto.link,
                    channel_id: socialLinksChannelDto.channel_id,
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
        return await this.prisma.socialLinksChannel.findMany();
    }

    async findOne(id: number) {
        return await this.prisma.socialLinksChannel.findUnique({
            where: {
                id,
            }
        });
    }

    async findForChannel(id: number) {
        return await this.prisma.socialLinksChannel.findMany({
            where: {
                channel_id: id,
            }
        });
    }

    async update(id: number, socialLinksChannelDto: SocialLinksChannelDto) {
        try {
            const newLink = await this.prisma.socialLinksChannel.update({
                where: {
                    id: id,
                },
                data: {
                    // name: socialLinksChannelDto.name,
                    // description: socialLinksChannelDto.description,
                    link: socialLinksChannelDto.link,
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
            const link = await this.prisma.socialLinksChannel.delete({
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
