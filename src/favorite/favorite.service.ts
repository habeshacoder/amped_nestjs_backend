/* eslint-disable prettier/prettier */
import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { FavoriteDto } from "./dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { User } from "@prisma/client";

@Injectable()
export class FavoriteService {
    constructor(
        private prisma: PrismaService,
    ) {}

    async create(favoriteDto: FavoriteDto, user: User) {
        
        try {

            const favoriteMaterial = await this.prisma.favorite.findFirst({
                where: {
                    material_id: favoriteDto.material_id,
                }
            })

            if(!favoriteMaterial){
            const favorite = await this.prisma.favorite.create({
                data: {
                    user_id: user.id,
                    material_id: favoriteDto.material_id,
                    channel_id: favoriteDto.channel_id,
                },
            });

            if (favorite) {                
                return favorite;
            }
        } else {
            return {'message': "Material already added in Favorite"};
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

    async findAll() {
        return await this.prisma.favorite.findMany({
            include: {
                material: true,
                channel: true,
            }
        });
    }

    async findOne(id: number) {
        //also add all associated data like images and preview
        return await this.prisma.favorite.findUnique({
            where: {
                id,
            }
        });
    }

    async findForUser(userId: string) {
        return await this.prisma.favorite.findMany({
            where: {
                user_id: userId,
            },
            include: {
                material: true,
                channel: true,
            }
        });
    }

    async update(id: number, favoriteDto: FavoriteDto) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                id: id,
            }
        })

        if (favorite) {
            try {
                const newFavorite = await this.prisma.favorite.update({
                    where: {
                        id: id,
                    },
                    data: {
                        material_id: favoriteDto.material_id,
                        channel_id: favoriteDto.channel_id,
                    },
                });

                if (newFavorite) {
                    return newFavorite;
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
        } else {
            throw new ForbiddenException (
                'Can\'t update while there is no material. Please create a material first.'
            )
        }
    }

    async remove(id: number) {
        const favorite = await this.prisma.favorite.findFirst({
            where: {
                id: id,
            }
        })

        if (favorite) {
            //remove all related data like file, images and preview
            try {
                const favorite = await this.prisma.favorite.delete({
                    where: {
                        id: id,
                    }
                });

                if (favorite) {
                    return {'message': "Favourite deleted successfully"};
                }
            } catch(error) {
                throw new ForbiddenException (
                    'There has been an error. Please check the inputs and try again.'
                )
            }
        } else {
            throw new ForbiddenException (
                'Can\'t delete while there is no favorite. Please create a favorite first.'
            )
        }
    }
}