import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { ReplayDto } from './dto/replay.dto';
import { UpdateReplayDto } from './dto/update-replay.dto';

@Injectable()
export class ReplayService {
  constructor(private prisma: PrismaService) {}

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ForbiddenException('Credentials Taken');
    }
    throw new ForbiddenException(
      'There has been an error. Please check the inputs and try again.',
    );
  }

  async create(replayDto: ReplayDto) {
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        remark_id: replayDto.remark_id,
      },
    });

    if (!foundReplay) {
      try {
        const replay = await this.prisma.replay.create({
          data: {
            remark_id: replayDto.remark_id,
            replay: replayDto.replay,
          },
        });

        if (replay) {
          return replay;
        }
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ForbiddenException(
        "Can't replay on the same remark multiple times. Please try edit the remark.",
      );
    }
  }

  async findAll() {
    const replays = await this.prisma.replay.findMany();

    if (replays && replays.length > 0) {
      return replays;
    } else {
      return { message: 'No comment found.' };
    }
  }

  async findOne(id: number) {
    const foundReplay = await this.prisma.replay.findUnique({
      where: {
        id,
      },
    });

    if (foundReplay) {
      return foundReplay;
    } else {
      return { message: 'No replay found.' };
    }
  }

  async checkReplays(remark_id: number) {
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        remark_id,
      },
    });

    return !!foundReplay;
  }

  async findByRemarkId(remark_id: number) {
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        remark_id,
      },
    });

    if (foundReplay) {
      return foundReplay;
    } else {
      return { message: 'No replay found.' };
    }
  }

  async replayForRemark(remark_id: number) {
    const foundRemark = await this.prisma.rate.findFirst({
      where: {
        id: remark_id,
      },
    });
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        remark_id,
      },
    });

    if (foundRemark && foundReplay) {
      return {
        remark: foundRemark['remark'],
        replay: foundReplay['replay'],
      };
    } else {
      return { message: 'No replay for this remark.' };
    }
  }

  async update(id: number, updateReplayDto: UpdateReplayDto) {
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        id: id,
      },
    });

    if (foundReplay) {
      try {
        const replay = await this.prisma.replay.update({
          where: {
            id: id,
          },
          data: {
            replay: updateReplayDto.replay,
          },
        });

        if (replay) {
          return replay;
        } else {
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      } catch (error) {
        this.handlePrismaError(error);
      }
    } else {
      throw new ForbiddenException(
        "Can't update while there is no comment. Please check the id and try again.",
      );
    }
  }

  async remove(id: number) {
    const foundReplay = await this.prisma.replay.findFirst({
      where: {
        id: id,
      },
    });

    if (foundReplay) {
      try {
        const replay = await this.prisma.replay.delete({
          where: {
            id: id,
          },
        });

        if (replay) {
          return { message: 'Replay deleted successfully' };
        }
      } catch {
        throw new ForbiddenException(
          'There has been an error. Please check the id and try again.',
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't delete while there is no replay. Please Replay for remark first.",
      );
    }
  }
}
