import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { IdeaService } from './idea.service';
import { AuthGuard } from 'src/modules/v1/auth/guard/auth.guard';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { IdeaCreateDTO, IdeaUpdateDTO, IdeaListDTO } from './dto/idea.dto';
import { FileService } from 'src/modules/v1/file/file.service';

@Controller('api/v1/idea')
@ApiTags('Idea')
@UseGuards(AuthGuard)
export class IdeaController {
  constructor(private readonly service: IdeaService, private readonly fileService: FileService) {}
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'document_id', maxCount: 1 },
      { name: 'image_id', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async createOne(@UploadedFiles() files: { document_id?: any; image_id?: any }, @Body() dto: IdeaCreateDTO) {
    if (files && (files.image_id || files.document_id)) {
      const fileArr = [];
      if (Array.isArray(files.image_id)) fileArr.push(files.image_id[0]);
      if (Array.isArray(files.document_id)) fileArr.push(files.document_id[0]);
      const filePromises = fileArr.map(async (e) => {
        const mime = e.mimetype.split('/')[1];
        const mines = e.fieldname === 'image_id' ? ['jpeg', 'jpg', 'png', 'gif'] : ['pdf', 'docx', 'doc', 'txt', 'xlsx', 'xls', 'pptx', 'ppt'];
        const type = e.fieldname === 'image_id' ? 'image' : 'document';
        if (!mines.includes(mime)) {
          throw new BadRequestException(e.fieldname + ` is must be an ${type}`);
        }
        if (e.size > process.env.MAX_UPLOAD_SIZE) {
          throw new BadRequestException(e.fieldname + ' is must be smaller than 5Mb');
        }
        const data = await this.fileService.createOneFile(e);
        if (data.id) {
          if (e.fieldname === 'image_id') {
            dto.image_id = data.id;
          } else if (e.fieldname === 'document_id') {
            dto.document_id = data.id;
          }
        }
      });
      await Promise.all(filePromises);
    }
    return await this.service.createOne(dto);
  }

  @Put(':id')
  async updateOne(@Param('id') id: number, @Body() dto: IdeaUpdateDTO) {
    return await this.service.updateOne(id, dto);
  }
  @Post(':id/upvote')
  upvoteIdea(@Param('id') id: number) {
    return this.service.upVote(id);
  }
  @Post(':id/downvote')
  downvoteIdea(@Param('id') id: number) {
    return this.service.downVote(id);
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: number) {
    return await this.service.deleteOne(id);
  }
}
