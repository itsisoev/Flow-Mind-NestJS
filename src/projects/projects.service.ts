import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { Task } from './entities/task.entity';
import { TelegramNotifierService } from '../tg-bot/services/telegram-notifier.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly notifier: TelegramNotifierService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userUUID: string,
  ): Promise<Project> {
    const user = await this.userRepository.findOneBy({ uuid: userUUID });
    if (!user) throw new NotFoundException('User not found');

    const project = this.projectRepository.create({
      ...createProjectDto,
      user,
    });
    const savedProject = await this.projectRepository.save(project);

    if (user.telegramChatId) {
      await this.notifier.notifyUser(
        user.telegramChatId,
        `✅ Создан новый проект: "${savedProject.title}"`,
      );
    }

    return savedProject;
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
      relations: ['user', 'tasks', 'tasks.owner'],
    });

    if (!project)
      throw new NotFoundException('Project not found or access denied');
    return project;
  }

  async getProjectUsers(projectUUID: string, userUUID: string) {
    const project = await this.projectRepository.findOne({
      where: { uuid: projectUUID },
      relations: ['user'],
    });

    if (!project || project.user.uuid !== userUUID) {
      throw new NotFoundException('Проект не найден или доступ запрещён');
    }

    return this.userRepository.find();
  }
}
