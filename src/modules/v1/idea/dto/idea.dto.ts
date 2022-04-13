import { IsNotEmpty, IsInt, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdeaCreateDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsInt()
  topic_id: number;

  @IsOptional()
  @IsString()
  @ApiProperty()
  title: string | null;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  description: string | null;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  is_incognito: number;
}

export class IdeaListDTO {
  limit: number;
  page: number;
  keyword?: string;
}

export class IdeaGetDTO {
  id: number;
}

export class IdeaUpdateDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  title: string | null;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  description: string | null;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false })
  is_incognito: number;
}
