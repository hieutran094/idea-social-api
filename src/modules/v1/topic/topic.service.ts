import { Injectable, Inject, HttpException, HttpStatus, Scope, NotFoundException } from '@nestjs/common';
import { TopicEntity } from 'src/entities/topic.entity';
import { UserEntity } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseService } from 'src/common/base.service';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { TopicCreateDTO, TopicUpdateDTO } from './dto/topic.dto';

@Injectable()
export class TopicService extends BaseService<TopicEntity> {
  constructor(@InjectRepository(TopicEntity) repo: Repository<TopicEntity>, @Inject(REQUEST) protected readonly request) {
    super(repo, request);
  }
  override async getOne(id: number): Promise<TopicEntity> {
    return await this.repo
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.ideas', 'ideas', 'ideas.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .where('topic.id = :id', { id })
      .andWhere('topic.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getOne();
  }
  async createOne(dto: TopicCreateDTO): Promise<TopicEntity | any> {
    try {
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
  async updateOne(id: number, dto: TopicUpdateDTO): Promise<TopicEntity | any> {
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
}
