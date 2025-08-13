import { IsNotEmpty, IsString, Length, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Bone, Diagram } from './diagram.interface';

export class BoneDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  label: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  info?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  metadata?: string;

  @IsOptional()
  @IsEnum(['resolved', 'issue', 'pending'])
  status?: 'resolved' | 'issue' | 'pending';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoneDto)
  children?: BoneDto[];
}

export class CreateDiagramDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  creator: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  effectLabel: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  effectInfo?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  effectString?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  effectMeta?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoneDto)
  roots: BoneDto[];
}

export class UpdateDiagramDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  creator?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  effectLabel?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  effectInfo?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  effectString?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  effectMeta?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoneDto)
  roots?: BoneDto[];
}

// Pagination DTOs
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}