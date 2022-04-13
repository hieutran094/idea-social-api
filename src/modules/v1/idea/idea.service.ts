import { Injectable, Inject, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { IdeaEntity } from 'src/entities/idea.entity';
import { TopicEntity } from 'src/entities/topic.entity';
import { UserEntity } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseService } from 'src/common/base.service';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { IdeaCreateDTO, IdeaUpdateDTO } from './dto/idea.dto';

@Injectable()
export class IdeaService extends BaseService<IdeaEntity> {
  constructor(@InjectRepository(IdeaEntity) repo: Repository<IdeaEntity>, @Inject(REQUEST) protected readonly request) {
    super(repo, request);
  }
  override async getOne(id: number): Promise<IdeaEntity> {
    return await this.repo
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag')
      .where('idea.id = :id', { id })
      .andWhere('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getOne();
  }
  override async getMany(): Promise<IdeaEntity[]> {
    return await this.repo
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag')
      .andWhere('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getMany();
  }
  override async search(query: any): Promise<any> {
    try {
      const limit = Number(query.limit) || 10;
      const page = Number(query.page) || 1;
      const qb = this.repo
        .createQueryBuilder('idea')
        .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
        .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .where('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .skip(limit * (page - 1))
        .take(limit)
        .orderBy('idea.id', 'ASC');
      if (query.keyword) qb.andWhere({ title: Like(`%${query.keyword}%`) });
      const data = await qb.getManyAndCount();
      return this.paginateResponse(data, page, limit);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async createOne(dto: IdeaCreateDTO): Promise<IdeaEntity | any> {
    try {
      const entity = plainToClass(IdeaEntity, dto);
      entity.creator_id = this.request.user.id;
      if (entity.creator_id) {
        const user = await this.connection.getRepository(UserEntity).findOne({ where: { id: this.request.user.id, delete_flag: 0 } });
        entity.author = user;
        delete entity.creator_id;
      }
      if (entity.topic_id) {
        const topic = await this.connection.getRepository(TopicEntity).findOne({ where: { id: entity.topic_id, delete_flag: 0 } });
        if (!topic) throw new HttpException('Topic not found', HttpStatus.BAD_REQUEST);
        entity.topic = topic;
        delete entity.topic_id;
      }
      await this.repo.save(entity);
      return { message: 'Created successfully' };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
  async updateOne(id: number, dto: IdeaUpdateDTO): Promise<IdeaEntity | any> {
    try {
      const current = await this.getOne(id);
      if (!current) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }
      const entity = plainToClassFromExist(current, dto);
      await this.repo.save(entity);
      return { message: 'Updated successfully' };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
