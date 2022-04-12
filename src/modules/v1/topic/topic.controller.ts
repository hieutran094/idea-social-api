import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TopicService } from './topic.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { RolesGuard } from 'src/modules/v1/auth/guard/role.guard';
import { Role } from 'src/modules/v1/auth/decorator/role.decorator';
import { ERole } from 'src/enum/role.enum';
import { ApiTags } from '@nestjs/swagger';
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
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.service.getOne(id);
  }
  @Post()
  @Role(ERole.root, ERole.admin, ERole.qa)
  async createOne(@Body() dto: TopicCreateDTO) {
    return await this.service.createOne(dto);
  }
  @Put(':id')
  @Role(ERole.root, ERole.admin, ERole.qa)
  async updateOne(@Param('id') id: number, @Body() dto: TopicUpdateDTO) {
    return await this.service.updateOne(id, dto);
  }
  @Delete(':id')
  @Role(ERole.root, ERole.admin, ERole.qa)
  async deleteOne(@Param('id') id: number) {
    return await this.service.deleteOne(id);
  }
}
