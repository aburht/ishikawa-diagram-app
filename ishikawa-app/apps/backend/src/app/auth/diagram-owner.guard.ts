import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DiagramsService } from '../diagrams/diagrams.service';

@Injectable()
export class DiagramOwnerGuard implements CanActivate {
  constructor(private readonly diagramsService: DiagramsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const diagramId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!diagramId) {
      throw new ForbiddenException('Diagram ID required');
    }

    try {
      const diagram = this.diagramsService.findOne(diagramId);

      // Allow access if user is the creator or if diagram is public
      if (diagram.creatorId !== user.id) {
        throw new ForbiddenException('You can only access your own diagrams');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Diagram not found');
      }
      throw error;
    }
  }
}
