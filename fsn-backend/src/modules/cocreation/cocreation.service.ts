import {
  Injectable, NotFoundException, ForbiddenException,
  ConflictException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  RequestCoCreationDto, UpdateCoCreationStatusDto,
  UpdateWorkspaceDto, AddNgoFacilitatorDto,
} from './dto/cocreation.dto';
import { CoCreationStatus, NotificationType } from '../../common/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CoCreationService {
  private readonly logger = new Logger(CoCreationService.name);
  constructor(private prisma: PrismaService) {}

  async request(innovatorId: string, dto: RequestCoCreationDto) {
    const problem = await this.prisma.problem.findFirst({
      where: { id: dto.problemId, isDeleted: false },
      select: { id: true, postedBy: true, title: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const existing = await this.prisma.coCreation.findFirst({
      where: { problemId: dto.problemId, innovatorId, status: { in: ['pending','active'] } },
    });
    if (existing) throw new ConflictException('A co-creation request already exists for this problem');

    const workspaceId = uuidv4();
    const cc = await this.prisma.$transaction(async (tx) => {
      const created = await tx.coCreation.create({
        data: {
          problemId: dto.problemId,
          solutionId: dto.solutionId,
          innovatorId,
          communityUserId: problem.postedBy,
          status: 'pending',
          workspaceId,
        },
        include: {
          innovator: { select: { id: true, fullName: true, role: true } },
          problem:   { select: { id: true, title: true } },
        },
      });
      await tx.workspace.create({
        data: { id: workspaceId, coCreationId: created.id, notes: '', tasks: [], files: [] },
      });
      return created;
    });

    await this.prisma.notification.create({
      data: {
        userId: problem.postedBy,
        type: NotificationType.CO_CREATION_REQUEST,
        title: 'Co-creation request received',
        body: `An innovator wants to co-create on: "${problem.title}"`,
        metadata: { coCreationId: cc.id },
      },
    });
    return cc;
  }

  async findOne(id: string, requesterId: string) {
    const cc = await this.prisma.coCreation.findUnique({
      where: { id },
      include: {
        innovator:     { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        communityUser: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        ngoFacilitator:{ select: { id: true, fullName: true, role: true } },
        problem:       { select: { id: true, title: true, category: true } },
        solution:      { select: { id: true, title: true, status: true } },
        workspace: true,
      },
    });
    if (!cc) throw new NotFoundException('Co-creation not found');
    this.assertParticipant(cc, requesterId);
    return cc;
  }

  async updateStatus(id: string, requesterId: string, dto: UpdateCoCreationStatusDto) {
    const cc = await this.prisma.coCreation.findUnique({ where: { id } });
    if (!cc) throw new NotFoundException('Co-creation not found');
    if (dto.status !== 'closed' && cc.communityUserId !== requesterId)
      throw new ForbiddenException('Only the problem poster can accept or decline');

    const updated = await this.prisma.coCreation.update({
      where: { id }, data: { status: dto.status as any },
    });

    if (dto.status === CoCreationStatus.ACTIVE) {
      await this.prisma.notification.create({
        data: {
          userId: cc.innovatorId,
          type: NotificationType.CO_CREATION_ACCEPTED,
          title: 'Co-creation accepted!',
          body: 'Your co-creation request has been accepted. Workspace is ready.',
          metadata: { coCreationId: id },
        },
      });
    }
    return updated;
  }

  async getWorkspace(coCreationId: string, requesterId: string) {
    const cc = await this.prisma.coCreation.findUnique({
      where: { id: coCreationId }, include: { workspace: true },
    });
    if (!cc) throw new NotFoundException('Co-creation not found');
    this.assertParticipant(cc, requesterId);
    if (!cc.workspace) throw new NotFoundException('Workspace not initialised');
    return cc.workspace;
  }

  async addTask(coCreationId: string, requesterId: string, task: any) {
    const cc = await this.prisma.coCreation.findUnique({
      where: { id: coCreationId }, include: { workspace: true },
    });
    if (!cc) throw new NotFoundException('Co-creation not found');
    this.assertParticipant(cc, requesterId);
    const tasks = (cc.workspace?.tasks as any[]) ?? [];
    const newTask = { id: uuidv4(), ...task, done: false, createdAt: new Date() };
    return this.prisma.workspace.update({
      where: { coCreationId }, data: { tasks: [...tasks, newTask] as any },
    });
  }

  async updateWorkspaceNotes(coCreationId: string, requesterId: string, notes: string) {
    const cc = await this.prisma.coCreation.findUnique({ where: { id: coCreationId } });
    if (!cc) throw new NotFoundException('Co-creation not found');
    this.assertParticipant(cc, requesterId);
    return this.prisma.workspace.update({ where: { coCreationId }, data: { notes } });
  }

  private assertParticipant(cc: any, userId: string) {
    if (cc.innovatorId !== userId && cc.communityUserId !== userId && cc.ngoFacilitatorId !== userId)
      throw new ForbiddenException('You are not a participant in this co-creation');
  }
}