import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  Logger,
  UseGuards
} from '@nestjs/common';
import { DiagramsService } from './diagrams.service';
import { CreateDiagramDto, UpdateDiagramDto, PaginationDto } from './diagram.dto';
import { Diagram } from './diagram.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiagramOwnerGuard } from '../auth/diagram-owner.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.interface';

@Controller('diagrams')
export class DiagramsController {
  private readonly logger = new Logger(DiagramsController.name);

  constructor(private readonly diagramsService: DiagramsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() pagination?: PaginationDto,
    @CurrentUser() user?: Omit<User, 'password'>
  ) {
    this.logger.log(`GET /diagrams - Finding all diagrams for user ${user?.id}`);
    try {
      if (pagination && (pagination.page || pagination.limit || pagination.search)) {
        return this.diagramsService.findAll(pagination, user.id);
      }
      return this.diagramsService.findAllSimple(user?.id);
    } catch (error) {
      this.logger.error(`Failed to find diagrams: ${error.message}`);
      throw error;
    }
  }

  @Get('public')
  @HttpCode(HttpStatus.OK)
  findAllPublic(@Query() pagination?: PaginationDto) {
    this.logger.log('GET /diagrams/public - Finding all public diagrams');
    try {
      if (pagination && (pagination.page || pagination.limit || pagination.search)) {
        return this.diagramsService.findAll(pagination);
      }
      return this.diagramsService.findAllSimple();
    } catch (error) {
      this.logger.error(`Failed to find public diagrams: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getStats(@CurrentUser() user: Omit<User, 'password'>) {
    this.logger.log(`GET /diagrams/stats - Getting statistics for user ${user.id}`);
    try {
      return this.diagramsService.getStats();
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, DiagramOwnerGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>
  ): Diagram {
    this.logger.log(`GET /diagrams/${id} - Finding diagram for user ${user.id}`);
    try {
      return this.diagramsService.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to find diagram ${id}: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) createDiagramDto: CreateDiagramDto,
    @CurrentUser() user: Omit<User, 'password'>
  ): Diagram {
    this.logger.log(`POST /diagrams - Creating diagram: ${createDiagramDto.name} for user ${user.id}`);
    try {
      return this.diagramsService.create(createDiagramDto, user.id);
    } catch (error) {
      this.logger.error(`Failed to create diagram: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, DiagramOwnerGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, skipMissingProperties: true })) updateDiagramDto: UpdateDiagramDto,
    @CurrentUser() user: Omit<User, 'password'>
  ): Diagram {
    this.logger.log(`PUT /diagrams/${id} - Updating diagram for user ${user.id}`);
    try {
      return this.diagramsService.update(id, updateDiagramDto);
    } catch (error) {
      this.logger.error(`Failed to update diagram ${id}: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, DiagramOwnerGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'password'>
  ): void {
    this.logger.log(`DELETE /diagrams/${id} - Deleting diagram for user ${user.id}`);
    try {
      this.diagramsService.delete(id);
    } catch (error) {
      this.logger.error(`Failed to delete diagram ${id}: ${error.message}`);
      throw error;
    }
  }
}