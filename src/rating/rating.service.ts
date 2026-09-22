import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RatingDto } from './dto';
import { User } from '@prisma/client';
import { UpdateRatingDto } from './dto/update-rating.dto';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../common/exceptions/domain-exceptions';
import { handlePrismaError } from '../common/services/prisma-error.util';

@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  async create(ratingDto: RatingDto, user: User) {
    const rating = await this.prisma.rate.findFirst({
      where: {
        user_id: user.id,
        material_id: ratingDto.material_id,
        channel_id: ratingDto.channel_id,
      },
    });

    if (!rating) {
      if (
        (!ratingDto.channel_id && ratingDto.material_id) ||
        (ratingDto.channel_id && !ratingDto.material_id)
      ) {
        try {
          const rate = await this.prisma.rate.create({
            data: {
              user_id: user.id,
              rating: ratingDto.rating,
              remark: ratingDto.remark,
              material_id: ratingDto.material_id,
              channel_id: ratingDto.channel_id,
            },
          });

          return rate;
        } catch (error) {
          handlePrismaError(error);
        }
      } else {
        throw new ValidationError('Please input material or channel.');
      }
    } else {
      throw new ConflictError(
        "Can't rate on the same material or channel multiple times. Please try edit the rating.",
      );
    }
  }

  async findAll() {
    const rating = await this.prisma.rate.findMany();

    if (rating && rating.length > 0) {
      return rating;
    } else {
      throw new NotFoundError('No rating found.', 'RATING_NOT_FOUND');
    }
  }

  async findOne(id: number) {
    const rating = await this.prisma.rate.findUnique({
      where: {
        id,
      },
    });

    if (rating) {
      return rating;
    } else {
      throw new NotFoundError('No rating found.', 'RATING_NOT_FOUND');
    }
  }

  async getMyReview(user: User) {
    const rating = await this.prisma.rate.findMany({
      where: {
        user_id: user.id,
      },
    });

    if (rating && rating.length > 0) {
      return rating;
    } else {
      throw new NotFoundError('No review found.', 'REVIEW_NOT_FOUND');
    }
  }

  async getByRatingNo(user: User, rating: number) {
    const myReviews = await this.prisma.rate.findMany({
      where: {
        rating: rating,
      },
    });

    if (myReviews && myReviews.length > 0) {
      return myReviews;
    } else {
      throw new NotFoundError('No review found.', 'REVIEW_NOT_FOUND');
    }
  }

  async getMyMaterialReview(material_id: number, user: User) {
    const rating = await this.prisma.rate.findFirst({
      where: {
        material_id: material_id,
        user_id: user.id,
      },
    });

    if (rating) {
      return rating;
    } else {
      return false;
    }
  }

  async getMyChannelReview(channel_id: number, user: User) {
    if (!Number.isNaN(channel_id) && channel_id != null) {
      const rating = await this.prisma.rate.findFirst({
        where: {
          channel_id: channel_id,
          user_id: user.id,
        },
      });

      if (rating) {
        return rating;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  async materialRating(material_id: number) {
    // find all material rating by material id
    // add all matterial rating and divide to the number of raters(users)
    // return the rating

    const default_rating = 0; //default material rate if nobody rate the material
    let rating = 0;
    let num_of_rate = 0;

    try {
      const rate = await this.prisma.rate.findMany({
        where: {
          material_id: material_id,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (rate && rate.length > 0) {
        for (const x of rate) {
          rating += x['rating'];
          num_of_rate++;
        }
        return {
          rating: rating / num_of_rate,
          rate,
        };
      } else {
        return default_rating;
      }
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async channelRating(channel_id: number) {
    // find all channel rating by channel id
    // add all channel rating and divide to the number of raters(users)
    // return the rating

    const default_rating = 0; //default channel rate if nobody rate the channel
    let rating = 0;
    let num_of_rate = 0;

    if (channel_id != null) {
      try {
        const rate = await this.prisma.rate.findMany({
          where: {
            channel_id: channel_id,
          },
        });

        if (rate && rate.length > 0) {
          for (const x of rate) {
            rating += x['rating'];
            num_of_rate++;
          }

          return {
            rating: rating / num_of_rate,
            rate,
          };
        } else {
          return default_rating;
        }
      } catch (error) {
        handlePrismaError(error);
      }
    } else {
      return 0;
    }
  }

  async noOfMaterialRating(params: { rating?: number; material_id?: number }) {
    const { rating, material_id } = params;

    //HOW MANY PEOPLE RATE 5,4,3,2,1
    const rateNo = await this.prisma.rate.findMany({
      where: {
        material_id: material_id,
        rating: rating,
      },
    });

    if (rateNo) {
      return rateNo.length;
    } else {
      return 0;
    }
  }

  async noOfChannelRating(params: { rating?: number; channel_id?: number }) {
    const { rating, channel_id } = params;

    //HOW MANY PEOPLE RATE 5,4,3,2,1
    const rateNo = await this.prisma.rate.findMany({
      where: {
        channel_id: channel_id,
        rating: rating,
      },
    });

    if (rateNo) {
      return rateNo.length;
    } else {
      return 0;
    }
  }

  async update(id: number, updateRatingDto: UpdateRatingDto) {
    const rate = await this.prisma.rate.findFirst({
      where: {
        id: id,
      },
    });

    if (rate) {
      try {
        const rating = await this.prisma.rate.update({
          where: {
            id: id,
          },
          data: {
            rating: updateRatingDto.rating,
            remark: updateRatingDto.remark,
          },
        });

        return rating;
      } catch (error) {
        handlePrismaError(error);
      }
    } else {
      throw new NotFoundError(
        "Can't update while there is no rating and remark. Please fill the nessessory input first.",
      );
    }
  }

  async remove(id: number) {
    const rate = await this.prisma.rate.findFirst({
      where: {
        id: id,
      },
    });

    if (rate) {
      try {
        await this.prisma.rate.delete({
          where: {
            id: id,
          },
        });

        return { message: 'Rate deleted successfully' };
      } catch (error) {
        handlePrismaError(error);
      }
    } else {
      throw new NotFoundError(
        "Can't delete while there is no rating. Please rate a material or channel first.",
      );
    }
  }
}
