import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UseInterceptors, UploadedFiles, Res } from '@nestjs/common';
import { TopicService } from './topic.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { RolesGuard } from 'src/modules/v1/auth/guard/role.guard';
import { Role } from 'src/modules/v1/auth/decorator/role.decorator';
import { ERole } from 'src/enum/role.enum';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TopicCreateDTO, TopicUpdateDTO, TopicListDTO } from './dto/topic.dto';

@Controller('api/v1/topic')
@ApiTags('Topic')
@UseGuards(AuthGuard, RolesGuard)
export class TopicController {
  constructor(private readonly service: TopicService) {}
  @Get()
  async getMany() {
    return await this.service.getMany();
  }
  @Get('/search')
  async search(@Query() query: TopicListDTO) {
    return await this.service.search(query);
  }
  @Get('/:id/download')
  async download(@Param('id') id: number, @Res() res: any) {
    return await this.service.download(id, res);
  }
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.service.getOne(id);
  }
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image_id', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  @Role(ERole.root, ERole.admin, ERole.qa)
  async createOne(@UploadedFiles() files: { image_id?: any }, @Body() dto: TopicCreateDTO) {
    return await this.service.createOne(files, dto);
  }
  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image_id', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  @Role(ERole.root, ERole.admin, ERole.qa)
  async updateOne(@Param('id') id: number, @UploadedFiles() files: { image_id?: any }, @Body() dto: TopicUpdateDTO) {
    return await this.service.updateOne(id, files, dto);
  }
  @Delete(':id')
  @Role(ERole.root, ERole.admin, ERole.qa)
  async deleteOne(@Param('id') id: number) {
    return await this.service.deleteOne(id);
  }
}
