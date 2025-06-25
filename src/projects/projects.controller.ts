import {
  Body,
  Controller,
  Get,
  Param,
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
}
