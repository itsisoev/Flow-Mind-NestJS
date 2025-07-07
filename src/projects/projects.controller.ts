import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.create(createProjectDto, userUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':uuid/task')
  async addTask(
    @Param('uuid') uuid: string,
    @Body() taskDto: CreateTaskDto,
    @Req() req,
  ) {
    const userUUID = req.user.uuid;
    return this.projectsService.addTaskToProject(uuid, userUUID, taskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.findAllByUser(userUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string, @Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.findOneByUuidAndUser(uuid, userUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':uuid/tasks')
  async getTasksByProject(@Param('uuid') uuid: string, @Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.findTasksByProject(uuid, userUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/tasks/:uuid')
  async updateTaskStatus(
    @Param('uuid') uuid: string,
    @Body('done') done: boolean,
    @Body('status') status?: string,
  ) {
    return this.projectsService.updateTaskStatus(uuid, done, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/tasks/:taskUuid')
  async deleteTask(@Param('taskUuid') uuid: string, @Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.deleteTask(uuid, userUUID);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':uuid/participants/:participantUuid')
  async addParticipant(
    @Param('uuid') uuid: string,
    @Param('participantUuid') participantUuid: string,
    @Req() req,
  ) {
    const ownerUUID = req.user.uuid;
    return this.projectsService.addParticipant(
      uuid,
      ownerUUID,
      participantUuid,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/tasks/:uuid/transfer/:toUserUUID')
  async transferTask(
    @Param('uuid') taskUUID: string,
    @Param('toUserUUID') toUserUUID: string,
    @Req() req,
  ) {
    const fromUserUUID = req.user.uuid;
    return this.projectsService.transferTask(
      taskUUID,
      fromUserUUID,
      toUserUUID,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectUUID/users')
  async getProjectUsers(@Param('projectUUID') projectUUID: string, @Req() req) {
    const userUUID = req.user.uuid;
    return this.projectsService.getProjectUsers(projectUUID, userUUID);
  }
}
