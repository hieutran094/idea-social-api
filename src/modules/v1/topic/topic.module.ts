import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { TopicEntity } from 'src/entities/topic.entity';
import { FileService } from 'src/modules/v1/file/file.service';
import { UploadService } from 'src/common/upload.service';
import { FileEntity } from 'src/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopicEntity, FileEntity])],
  controllers: [TopicController],
  providers: [TopicService, FileService, UploadService],
})
export class TopicModule {}
