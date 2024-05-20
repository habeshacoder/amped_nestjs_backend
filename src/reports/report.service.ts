import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportDto } from './dto';
import { ReportType, User } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reportDto: ReportDto, user: User) {
    const findReport = await this.prisma.report.findFirst({
      where: {
        user_id: user.id,
        material_id: reportDto.material_id,
        channel_id: reportDto.channel_id,
      },
    });

    if (!findReport) {
      if (
        (!reportDto.channel_id && reportDto.material_id) ||
        (reportDto.channel_id && !reportDto.material_id)
      ) {
        try {
          let reportType: ReportType = reportDto.report_type; //parse to enum type

          const report = await this.prisma.report.create({
            data: {
              user_id: user.id,
              report_type: reportType,
              report_desc: reportDto.report_desc,
              material_id: reportDto.material_id,
              channel_id: reportDto.channel_id,
            },
          });

          if (report) {
            return report;
          }
        } catch (error) {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              throw new ForbiddenException('ForbiddenException');
            }
          }
          throw new ForbiddenException(
            'There has been an error. Please check the inputs and try again.',
          );
        }
      } else {
        throw new ForbiddenException(
          "Can't report on the same material or channel multiple times.",
        );
      }
    } else {
      throw new ForbiddenException(
        "Can't report on the same material or channel multiple times.",
      );
    }
  }

  async findAll() {
    const reports = await this.prisma.report.findMany({
      include: {
        user: true,
        Material: {
          include: {
            SellerProfile: true,
          },
        },
        Channel: true,
      },
    });

    if (reports) {
      return reports;
    } else {
      return { message: 'No reports found.' };
    }
  }

  async findOne(id: number) {
    const foundReport = await this.prisma.report.findUnique({
      where: {
        id,
      },
    });

    if (foundReport) {
      return foundReport;
    } else {
      return { message: 'No report found.' };
    }
  }

  async findByReportType(report_type: ReportType) {
    const foundReport = await this.prisma.report.findMany({
      where: {
        report_type: report_type,
      },
    });

    if (foundReport) {
      return foundReport;
    } else {
      return { message: 'No report found.' };
    }
  }

  async reportsOnMaterial(material_id: number) {
    const foundReport = await this.prisma.report.findMany({
      where: {
        material_id: material_id,
      },
    });

    if (foundReport) {
      return foundReport;
    } else {
      return { message: 'No report found on material.' };
    }
  }

  async reportsOnChannel(channel_id: number) {
    const foundReport = await this.prisma.report.findMany({
      where: {
        channel_id: channel_id,
      },
    });

    if (foundReport) {
      return foundReport;
    } else {
      return { message: 'No report found on channel.' };
    }
  }

  async remove(id: number) {
    const rate = await this.prisma.report.findFirst({
      where: {
        id: id,
      },
    });

    if (rate) {
      try {
        const rating = await this.prisma.report.delete({
          where: {
            id: id,
          },
        });

        if (rating) {
          return { message: 'Report deleted successfully' };
        }
      } catch (error) {
        throw new ForbiddenException(
          'There has been an error. Please check the inputs and try again.',
        );
      }
    } else {
      throw new ForbiddenException("Can't delete while there is no report.");
    }
  }
}
