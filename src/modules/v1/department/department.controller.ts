import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { RolesGuard } from 'src/modules/v1/auth/guard/role.guard';
import { Role } from 'src/modules/v1/auth/decorator/role.decorator';
import { ERole } from 'src/enum/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { DepartmentCreateDTO, DepartmentUpdateDTO } from './dto/department.dto';

@Controller('api/v1/department')
@ApiTags('Department')
@UseGuards(AuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}
  @Get()
  async getMany() {
    return await this.service.getMany();
  }
  @Get(':id')
  async getOne(@Param() id: number) {
    return await this.service.getOne(id);
  }
  @Post()
  @Role(ERole.root, ERole.admin)
  async createOne(@Body() dto: DepartmentCreateDTO) {
    return await this.service.createOne(dto);
  }
  @Put(':id')
  @Role(ERole.root, ERole.admin)
  async updateOne(@Param() id: number, @Body() dto: DepartmentUpdateDTO) {
    return await this.service.updateOne(id, dto);
  }
}
