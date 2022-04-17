import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Scope,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TopicEntity } from 'src/entities/topic.entity';
import { UserEntity } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseService } from 'src/common/base.service';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { TopicCreateDTO, TopicUpdateDTO, TopicListDTO } from './dto/topic.dto';
import { FileService } from 'src/modules/v1/file/file.service';
import { ExportService } from 'src/common/export.service';
import * as JSZip from 'jszip';
import { get } from 'lodash';
import { ECsvHeader } from 'src/enum/csvHeader.enum';

@Injectable()
export class TopicService extends BaseService<TopicEntity> {
  constructor(
    @InjectRepository(TopicEntity) repo: Repository<TopicEntity>,
    @Inject(REQUEST) protected readonly request,
    private readonly fileService: FileService,
    private readonly exportSrv: ExportService,
  ) {
    super(repo, request);
  }
  override async getOne(id: number): Promise<TopicEntity> {
    const topic = await this.repo
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.creator', 'creator', 'creator.delete_flag = :deleteFlag')
      .leftJoinAndSelect('topic.image', 'image', 'image.delete_flag = :deleteFlag')
      .leftJoinAndSelect('topic.ideas', 'ideas', 'ideas.delete_flag = :deleteFlag')
      .leftJoinAndSelect('ideas.image', 'topicImage', 'topicImage.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .where('topic.id = :id', { id })
      .andWhere('topic.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getOne();
    return topic;
  }
  override async search(query: TopicListDTO): Promise<any> {
    try {
      const limit = Number(query.limit) || 10;
      const page = Number(query.page) || 1;
      const qb = this.repo
        .createQueryBuilder('topic')
        .leftJoinAndSelect('topic.ideas', 'ideas', 'ideas.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .leftJoinAndSelect('topic.creator', 'creator', 'creator.delete_flag = :deleteFlag')
        .leftJoinAndSelect('topic.image', 'image', 'image.delete_flag = :deleteFlag')
        .where('topic.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .skip(limit * (page - 1))
        .take(limit);
      if (query.keyword) qb.andWhere({ title: Like(`%${query.keyword}%`) });
      const [data, total] = await qb.getManyAndCount();
      return this.paginateResponse([data, total], page, limit);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async createOne(files: any, dto: TopicCreateDTO): Promise<TopicEntity | any> {
    try {
      if (files && Array.isArray(files.image_id)) {
        const e = files.image_id[0];
        const mime = e.mimetype.split('/')[1];
        const mines = ['jpeg', 'jpg', 'png', 'gif'];
        if (!mines.includes(mime)) {
          throw new BadRequestException(e.fieldname + ` is must be an image`);
        }
        if (e.size > process.env.MAX_UPLOAD_SIZE) {
          throw new BadRequestException(e.fieldname + ' is must be smaller than 5Mb');
        }
        const data = await this.fileService.createOneFile(e);
        if (data.id) {
          dto.image_id = data.id;
        }
      }
      const entity = plainToClass(TopicEntity, dto);
      entity.creator_id = this.request.user.id;
      if (entity.creator_id) {
        const user = await this.connection.getRepository(UserEntity).findOne({ where: { id: this.request.user.id } });
        entity.creator = user;
        delete entity.creator_id;
      }
      await this.repo.save(entity);
      return { message: 'Created successfully' };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
  async updateOne(id: number, files: any, dto: TopicUpdateDTO): Promise<TopicEntity | any> {
    try {
      const current = await this.repo
        .createQueryBuilder('topic')
        .where('topic.id = :id', { id })
        .andWhere('topic.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .getOne();
      if (!current) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }
      if (files && Array.isArray(files.image_id)) {
        const e = files.image_id[0];
        const mime = e.mimetype.split('/')[1];
        const mines = ['jpeg', 'jpg', 'png', 'gif'];
        if (!mines.includes(mime)) {
          throw new BadRequestException(e.fieldname + ` is must be an image`);
        }
        if (e.size > process.env.MAX_UPLOAD_SIZE) {
          throw new BadRequestException(e.fieldname + ' is must be smaller than 5Mb');
        }
        const data = await this.fileService.createOneFile(e);
        if (data.id) {
          dto.image_id = data.id;
        }
      }
      const entity = plainToClassFromExist(current, dto);
      await this.repo.save(entity);
      return { message: 'Updated successfully' };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
  override async deleteOne(id: number): Promise<TopicEntity | any> {
    try {
      const exist = await this.getOne(id);
      if (!exist) {
        throw new NotFoundException();
      }
      exist.delete_flag = 1;
      exist.ideas.map((idea) => {
        idea.delete_flag = 1;
      });
      await this.repo.save(exist);
      return { message: 'Deleted successfully.' };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
  async download(id: number, res): Promise<any> {
    try {
      const topic = await this.repo
        .createQueryBuilder('topic')
        .leftJoinAndSelect('topic.ideas', 'ideas', 'ideas.delete_flag = :deleteFlag')
        .leftJoinAndSelect('ideas.author', 'author', 'author.delete_flag = :deleteFlag')
        .leftJoinAndSelect('ideas.image', 'image', 'image.delete_flag = :deleteFlag')
        .leftJoinAndSelect('ideas.document', 'document', 'document.delete_flag = :deleteFlag')
        .leftJoinAndSelect('ideas.comments', 'comment', 'comment.delete_flag = :deleteFlag')
        .leftJoinAndSelect('comment.creator', 'creator', 'creator.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .leftJoinAndSelect('ideas.upVotes', 'upVotes')
        .leftJoinAndSelect('ideas.downVotes', 'downVotes')
        .where('topic.id = :id', { id })
        .andWhere('topic.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .getOne();
      if (!topic) {
        throw new NotFoundException();
      }
      const fileIds = topic.ideas.map((idea) => {
        const files = [];
        const names = [];
        if (idea.image_id) {
          files.push(idea.image_id);
          names.push(idea.image?.source_url);
        }
        if (idea.document_id) {
          files.push(idea.document_id);
          names.push(idea.document?.source_url);
        }
        return { id: idea.title || idea.id, files, names };
      });
      const zip = new JSZip();
      const promises = fileIds.map(async (item) => {
        const files = await this.fileService.downloadFiles(item.files);
        const folder = zip.folder(item.id.toString());
        item.names.forEach((value, index) => {
          folder.file(value.replace(`${process.env.AWS_S3_ENDPOINT}/files/`, ''), files[index].Body as any, { base64: true });
        });
      });
      const data = topic.ideas.map((idea) => {
        const row = {
          id: idea.id,
          title: idea.title,
          is_incognito: idea.is_incognito,
          description: idea.description,
          author: get(idea, 'author.user_name', ''),
          topic: topic.name,
          upVoteCount: idea.upVotes.length || 0,
          downVoteCount: idea.downVotes.length || 0,
          comment: idea.comments.length || 0,
          created_at: idea.created_at,
          updated_at: idea.updated_at,
        };
        return row;
      });

      await Promise.all(promises);
      const fileCsvName = `topic_${topic.id}_${Date.now()}.csv`;
      const header = Object.values(ECsvHeader);
      const csv = await this.exportSrv.handle(header, data);
      zip.file(fileCsvName, csv);
      const zipData = await zip.generateAsync({ type: 'nodebuffer' });
      const filename = `topic_${topic.id}_${Date.now()}.zip`;
      res.setHeader(`Content-disposition`, `attachment; filename=${filename}`);
      res.set('Content-Type', 'application/zip');
      res.status(200).send(zipData);
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
