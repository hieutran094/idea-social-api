import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { TopicEntity } from 'src/entities/topic.entity';
import { UploadService } from 'src/common/upload.service';
import { FileEntity } from 'src/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TopicEntity, FileEntity])],
  controllers: [ReportController],
  providers: [ReportService, UploadService],
})
export class ReportModule {}
