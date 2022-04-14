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
import { EVote } from 'src/enum/vote.enum';

@Injectable()
export class IdeaService extends BaseService<IdeaEntity> {
  constructor(@InjectRepository(IdeaEntity) repo: Repository<IdeaEntity>, @Inject(REQUEST) protected readonly request) {
    super(repo, request);
  }
  override async getOne(id: number): Promise<IdeaEntity> {
    const data = await this.repo
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.upVotes', 'upVotes')
      .leftJoinAndSelect('idea.downVotes', 'downVotes')
      .leftJoinAndSelect('idea.comments', 'comments')
      .where('idea.id = :id', { id })
      .andWhere('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getOne();
    if (data) {
      data.upVoteCount = data.upVotes.length;
      data.downVoteCount = data.downVotes.length;
      delete data.upVotes;
      delete data.downVotes;
    }
    return data;
  }
  override async getMany(): Promise<IdeaEntity[]> {
    const data = await this.repo
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag')
      .leftJoinAndSelect('idea.upVotes', 'upVotes')
      .leftJoinAndSelect('idea.downVotes', 'downVotes')
      .andWhere('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
      .getMany();
    if (data.length > 0) {
      data.map((e) => {
        e.upVoteCount = e.upVotes.length;
        e.downVoteCount = e.downVotes.length;
        delete e.upVotes;
        delete e.downVotes;
      });
    }
    return data;
  }
  override async search(query: any): Promise<any> {
    try {
      const limit = Number(query.limit) || 10;
      const page = Number(query.page) || 1;
      const qb = this.repo
        .createQueryBuilder('idea')
        .leftJoinAndSelect('idea.image', 'image', 'image.delete_flag = :deleteFlag')
        .leftJoinAndSelect('idea.document', 'document', 'document.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .leftJoinAndSelect('idea.upVotes', 'upVotes')
        .leftJoinAndSelect('idea.downVotes', 'downVotes')
        .where('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .skip(limit * (page - 1))
        .take(limit)
        .orderBy('idea.id', 'ASC');
      if (query.keyword) qb.andWhere({ title: Like(`%${query.keyword}%`) });
      const [data, total] = await qb.getManyAndCount();
      if (data.length > 0) {
        data.map((e) => {
          e.upVoteCount = e.upVotes.length;
          e.downVoteCount = e.downVotes.length;
          delete e.upVotes;
          delete e.downVotes;
        });
      }
      return this.paginateResponse([data, total], page, limit);
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

  async upVote(id: number) {
    const idea = await this.repo.findOne({
      where: { id },
      relations: ['author', 'upVotes', 'downVotes', 'comments'],
    });
    return await this.vote(idea, EVote.UP);
  }

  async downVote(id: number) {
    const idea = await this.repo.findOne({
      where: { id },
      relations: ['author', 'upVotes', 'downVotes', 'comments'],
    });
    return await this.vote(idea, EVote.DOWN);
  }
  private async vote(idea: IdeaEntity, vote: EVote) {
    const opposite = vote === EVote.UP ? EVote.DOWN : EVote.UP;
    const user = await this.connection.getRepository(UserEntity).findOne({ where: { id: this.request.user.id, delete_flag: 0 } });
    if (idea[opposite].filter((voter) => voter.id === user.id).length > 0 && idea[vote].filter((voter) => voter.id === user.id).length === 0) {
      idea[opposite] = idea[opposite].filter((voter) => voter.id !== user.id);
      idea[vote].push(user);
      await this.repo.save(idea);
    } else if (idea[opposite].filter((voter) => voter.id === user.id).length > 0 || idea[vote].filter((voter) => voter.id === user.id).length > 0) {
      idea[opposite] = idea[opposite].filter((voter) => voter.id !== user.id);
      idea[vote] = idea[vote].filter((voter) => voter.id !== user.id);
      await this.repo.save(idea);
    } else if (idea[vote].filter((voter) => voter.id === user.id).length < 1) {
      idea[vote].push(user);
      await this.repo.save(idea);
    } else {
      throw new HttpException('Unable to cast vote', HttpStatus.BAD_REQUEST);
    }
    return idea;
  }
}
