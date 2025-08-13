import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import { join } from 'path';
import { Diagram, Bone } from './diagram.interface';
import { CreateDiagramDto, UpdateDiagramDto, PaginationDto, PaginatedResponse } from './diagram.dto';

@Injectable()
export class DiagramsService {
  private readonly logger = new Logger(DiagramsService.name);
  private dbPath = join(__dirname, '../../db.json');
  private db: { diagrams: Diagram[] } = { diagrams: [] };

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        this.db = fs.readJsonSync(this.dbPath);
        this.logger.log(`Database loaded with ${this.db.diagrams.length} diagrams`);
      } else {
        this.logger.log('No existing database found, creating new one');
        this.saveDb();
      }
    } catch (error) {
      this.logger.error(`Failed to load database: ${error.message}`);
      throw new InternalServerErrorException('Failed to initialize database');
    }
  }

  private saveDb(): void {
    try {
      fs.writeJsonSync(this.dbPath, this.db, { spaces: 2 });
      this.logger.debug('Database saved successfully');
    } catch (error) {
      this.logger.error(`Failed to save database: ${error.message}`);
      throw new InternalServerErrorException('Failed to save data');
    }
  }

  private validateBoneStructure(bones: Bone[]): void {
    for (const bone of bones) {
      if (!bone.label || bone.label.trim().length === 0) {
        throw new BadRequestException('All bones must have a non-empty label');
      }
      if (bone.children && bone.children.length > 0) {
        this.validateBoneStructure(bone.children);
      }
    }
  }

  findAll(pagination?: PaginationDto, userId?: string): PaginatedResponse<Diagram> {
    try {
      this.logger.log(`Finding all diagrams with pagination: ${JSON.stringify(pagination)}, userId: ${userId}`);

      let filteredDiagrams = [...this.db.diagrams];

      // Filter by user if userId is provided
      if (userId) {
        filteredDiagrams = filteredDiagrams.filter(diagram => diagram.creatorId === userId);
      }

      // Apply search filter
      if (pagination?.search) {
        const searchTerm = pagination.search.toLowerCase();
        filteredDiagrams = filteredDiagrams.filter(diagram =>
          diagram.name.toLowerCase().includes(searchTerm) ||
          diagram.creator.toLowerCase().includes(searchTerm) ||
          diagram.effectLabel.toLowerCase().includes(searchTerm)
        );
      }

      const total = filteredDiagrams.length;
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      // Apply pagination
      const paginatedDiagrams = filteredDiagrams.slice(skip, skip + limit);

      return {
        data: paginatedDiagrams,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to find diagrams: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve diagrams');
    }
  }

  findAllSimple(userId?: string): Diagram[] {
    try {
      this.logger.log(`Finding all diagrams (simple), userId: ${userId}`);

      if (userId) {
        return this.db.diagrams.filter(diagram => diagram.creatorId === userId);
      }

      return this.db.diagrams;
    } catch (error) {
      this.logger.error(`Failed to find diagrams: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve diagrams');
    }
  }

  findOne(id: string): Diagram {
    try {
      this.logger.log(`Finding diagram with ID: ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('Diagram ID cannot be empty');
      }

      const diagram = this.db.diagrams.find(d => d.id === id);
      if (!diagram) {
        this.logger.warn(`Diagram with ID ${id} not found`);
        throw new NotFoundException(`Diagram with ID ${id} not found`);
      }

      this.logger.log(`Found diagram: ${diagram.name}`);
      return diagram;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to find diagram ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve diagram');
    }
  }

  create(createDto: CreateDiagramDto, creatorId?: string): Diagram {
    try {
      this.logger.log(`Creating new diagram: ${createDto.name}, creatorId: ${creatorId}`);

      // Validation
      if (!createDto.name || createDto.name.trim().length === 0) {
        throw new BadRequestException('Diagram name cannot be empty');
      }

      if (!createDto.creator || createDto.creator.trim().length === 0) {
        throw new BadRequestException('Creator name cannot be empty');
      }

      if (!createDto.effectLabel || createDto.effectLabel.trim().length === 0) {
        throw new BadRequestException('Effect label cannot be empty');
      }

      // Validate bone structure
      if (createDto.roots && createDto.roots.length > 0) {
        this.validateBoneStructure(createDto.roots);
      }

      const now = new Date();
      const newDiagram: Diagram = {
        id: uuidv4(),
        ...createDto,
        creatorId: creatorId || 'anonymous', // Use provided creatorId or default
        createdAt: now,
        updatedAt: now
      };

      this.db.diagrams.push(newDiagram);
      this.saveDb();

      this.logger.log(`Successfully created diagram: ${newDiagram.id}`);
      return newDiagram;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create diagram: ${error.message}`);
      throw new InternalServerErrorException('Failed to create diagram');
    }
  }

  update(id: string, updateDto: UpdateDiagramDto): Diagram {
    try {
      this.logger.log(`Updating diagram: ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('Diagram ID cannot be empty');
      }

      const index = this.db.diagrams.findIndex(d => d.id === id);
      if (index === -1) {
        this.logger.warn(`Diagram with ID ${id} not found for update`);
        throw new NotFoundException(`Diagram with ID ${id} not found`);
      }

      // Validation
      if (updateDto.name !== undefined && (!updateDto.name || updateDto.name.trim().length === 0)) {
        throw new BadRequestException('Diagram name cannot be empty');
      }

      if (updateDto.effectLabel !== undefined && (!updateDto.effectLabel || updateDto.effectLabel.trim().length === 0)) {
        throw new BadRequestException('Effect label cannot be empty');
      }

      // Validate bone structure if roots are being updated
      if (updateDto.roots && updateDto.roots.length > 0) {
        this.validateBoneStructure(updateDto.roots);
      }

      const updatedDiagram = {
        ...this.db.diagrams[index],
        ...updateDto,
        updatedAt: new Date()
      };

      this.db.diagrams[index] = updatedDiagram;
      this.saveDb();

      this.logger.log(`Successfully updated diagram: ${id}`);
      return updatedDiagram;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update diagram ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to update diagram');
    }
  }

  delete(id: string): void {
    try {
      this.logger.log(`Deleting diagram: ${id}`);

      if (!id || id.trim().length === 0) {
        throw new BadRequestException('Diagram ID cannot be empty');
      }

      const index = this.db.diagrams.findIndex(d => d.id === id);
      if (index === -1) {
        this.logger.warn(`Diagram with ID ${id} not found for deletion`);
        throw new NotFoundException(`Diagram with ID ${id} not found`);
      }

      const diagramName = this.db.diagrams[index].name;
      this.db.diagrams.splice(index, 1);
      this.saveDb();

      this.logger.log(`Successfully deleted diagram: ${diagramName} (${id})`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete diagram ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete diagram');
    }
  }

  // Analytics methods
  getStats(): any {
    try {
      const diagrams = this.db.diagrams;
      const totalDiagrams = diagrams.length;
      const totalBones = diagrams.reduce((sum, diagram) => {
        return sum + this.countBones(diagram.roots);
      }, 0);

      const creatorStats = diagrams.reduce((stats, diagram) => {
        stats[diagram.creator] = (stats[diagram.creator] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);

      return {
        totalDiagrams,
        totalBones,
        creatorStats,
        averageBonesPerDiagram: totalDiagrams > 0 ? Math.round(totalBones / totalDiagrams) : 0
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve statistics');
    }
  }

  private countBones(bones: Bone[]): number {
    return bones.reduce((count, bone) => {
      return count + 1 + (bone.children ? this.countBones(bone.children) : 0);
    }, 0);
  }
}