import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { TopicEntity } from 'src/entities/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopicEntity])],
  controllers: [TopicController],
  providers: [TopicService],
})
export class TopicModule {}
