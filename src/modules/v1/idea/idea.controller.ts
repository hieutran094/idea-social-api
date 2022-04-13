import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IdeaService } from './idea.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { RolesGuard } from 'src/modules/v1/auth/guard/role.guard';
import { ApiTags } from '@nestjs/swagger';
import { IdeaCreateDTO, IdeaUpdateDTO, IdeaListDTO } from './dto/idea.dto';

@Controller('api/v1/idea')
@ApiTags('Idea')
@UseGuards(AuthGuard, RolesGuard)
export class IdeaController {
  constructor(private readonly service: IdeaService) {}
  @Get()
  async getMany() {
    return await this.service.getMany();
  }
  @Get('/search')
  async search(@Query() query: IdeaListDTO) {
    return await this.service.search(query);
  }
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return await this.service.getOne(id);
  }
  @Post()
  async createOne(@Body() dto: IdeaCreateDTO) {
    return await this.service.createOne(dto);
  }
  @Put(':id')
  async updateOne(@Param('id') id: number, @Body() dto: IdeaUpdateDTO) {
    return await this.service.updateOne(id, dto);
  }
  @Delete(':id')
  async deleteOne(@Param('id') id: number) {
    return await this.service.deleteOne(id);
  }
}
