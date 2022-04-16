import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ReportService } from './report.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { RolesGuard } from 'src/modules/v1/auth/guard/role.guard';
import { Role } from 'src/modules/v1/auth/decorator/role.decorator';
import { ERole } from 'src/enum/role.enum';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TopicCreateDTO, TopicUpdateDTO, TopicListDTO } from './dto/report.dto';

@Controller('api/v1/report')
@ApiTags('Report')
@UseGuards(AuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly service: ReportService) {}
  @Get()
  @Role(ERole.admin, ERole.root)
  async overView() {
    return await this.service.overView();
  }
  @Get('/search')
  async search(@Query() query: TopicListDTO) {
    return await this.service.search(query);
  }
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.service.getOne(id);
  }
}
