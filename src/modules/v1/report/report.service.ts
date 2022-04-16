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
import { IdeaEntity } from 'src/entities/idea.entity';
import { CommentEntity } from 'src/entities/comment.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DepartmentEntity } from 'src/entities/department.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { BaseService } from 'src/common/base.service';
import { TopicCreateDTO, TopicUpdateDTO, TopicListDTO } from './dto/report.dto';
import { cloneDeep, groupBy } from 'lodash';

@Injectable()
export class ReportService extends BaseService<TopicEntity> {
  constructor(@InjectRepository(TopicEntity) repo: Repository<TopicEntity>, @Inject(REQUEST) protected readonly request) {
    super(repo, request);
  }
  async overView(): Promise<any> {
    try {
      const totalTopic = await this.repo.count({ where: { delete_flag: 0 } });
      const totalComment = await this.connection.getRepository(CommentEntity).count({ where: { delete_flag: 0 } });
      const totalUser = await this.connection.getRepository(UserEntity).count({ where: { delete_flag: 0 } });
      const departments = await this.connection.getRepository(DepartmentEntity).find({ where: { delete_flag: 0 } });
      const [data, total] = await this.connection
        .getRepository(IdeaEntity)
        .createQueryBuilder('idea')
        .leftJoinAndSelect('idea.author', 'author', 'author.delete_flag = :deleteFlag')
        .leftJoinAndSelect('author.department', 'department', 'department.delete_flag = :deleteFlag')
        .where('idea.delete_flag = :deleteFlag', { deleteFlag: 0 })
        .getManyAndCount();
      const rawDepIdea = data.map((idea) => {
        return idea.author?.department?.id;
      });
      const chartDepartmentIdea = departments.map((dep) => {
        const data = {
          id: dep.id,
          name: dep.name,
          count: rawDepIdea.filter((item) => item === dep.id).length,
        };
        return data;
      });
      return { totalTopic, totalIdea: total, totalComment, totalUser, chartDepartmentIdea };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
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
}
