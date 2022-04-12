import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopicCreateDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  description: string | null;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  lock_date: Date;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty()
  close_date: Date;
}

export class TopicListDTO {
  limit: number;
  page: number;
  keyword?: string;
}

export class TopicGetDTO {
  id: number;
}

export class TopicUpdateDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  name: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  description: string | null;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  lock_date: Date | null;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  close_date: Date | null;
}
