import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userUUID: string,
  ): Promise<Project> {
    const user = await this.userRepository.findOneBy({ uuid: userUUID });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      user,
    });

    return this.projectRepository.save(project);
  }

  async findAllByUser(userUUID: string): Promise<Project[]> {
    return this.projectRepository.find({
      where: { user: { uuid: userUUID } },
      relations: ['user'],
    });
  }

  async findOneByUuidAndUser(uuid: string, userUUID: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { uuid, user: { uuid: userUUID } },
      relations: ['user', 'tasks'],
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return project;
  }

  async addTaskToProject(
    projectUUID: string,
    userUUID: string,
    taskDto: CreateTaskDto,
  ): Promise<Task> {
    const project = await this.findOneByUuidAndUser(projectUUID, userUUID);

    const newTask = this.taskRepository.create({
      ...taskDto,
      project,
    });

    return this.taskRepository.save(newTask);
  }

  async findTasksByProject(
    projectUUID: string,
    userUUID: string,
  ): Promise<Task[]> {
    const project = await this.projectRepository.findOne({
      where: { uuid: projectUUID, user: { uuid: userUUID } },
      relations: ['tasks', 'user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project.tasks;
  }

  async updateTaskDoneStatus(
    taskUUID: string,
    done: boolean,
  ) {
    const task = await this.taskRepository.findOne({
      where: { uuid: taskUUID },
      relations: ['project', 'project.user'],
    });

    task.done = done;
    return this.taskRepository.save(task);
  }
}
