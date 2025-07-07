import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
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
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      user,
    });

    const savedProject = await this.projectRepository.save(project);

    if (user) {
      await this.notifier.notifyUser(
        user.telegramChatId,
        `✅ Создан новый проект: "${savedProject.title}"`,
      );
    }

    return this.projectRepository.save(project);
  }

  async findAllByUser(userUUID: string): Promise<Project[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('user.uuid = :userUUID', { userUUID })
      .orWhere('participant.uuid = :userUUID', { userUUID })
      .getMany();
  }

  async findOneByUuidAndUser(uuid: string, userUUID: string): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .leftJoinAndSelect('project.participants', 'participant')
      .leftJoinAndSelect('project.tasks', 'tasks')
      .leftJoinAndSelect('tasks.owner', 'taskOwner')
      .where('project.uuid = :uuid', { uuid })
      .andWhere(
        new Brackets((qb) => {
          qb.where('user.uuid = :userUUID', { userUUID }).orWhere(
            'participant.uuid = :userUUID',
            { userUUID },
          );
        }),
      )
      .getOne();

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
      owner: project.user,
    });

    const savedTask = await this.taskRepository.save(newTask);

    const user = project.user;

    if (user && user.telegramChatId) {
      const message = `✅ Новая задача добавлена в проект "${project.title}":
📝 Заголовок: ${savedTask.title}
📄 Описание: ${savedTask.description || '—'}
📅 Срок: ${savedTask.term || '—'}
🔥 Приоритет: ${savedTask.priority || '—'}`;

      await this.notifier.notifyUser(user.telegramChatId, message);
    }

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

  async updateTaskStatus(taskUUID: string, done: boolean, status?: string) {
    const task = await this.taskRepository.findOne({
      where: { uuid: taskUUID },
      relations: ['project', 'project.user'],
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    task.done = done;

    if (status && ['todo', 'in-progress', 'done'].includes(status)) {
      task.status = status as TaskStatus;
    }

    const savedTask = await this.taskRepository.save(task);

    const user = task.project.user;
    if (user && user.telegramChatId) {
      const statusLabels: Record<TaskStatus, string> = {
        todo: '🕐 Ожидает выполнения',
        'in-progress': '🔨 В процессе',
        done: '✅ Выполнена',
      };

      const message = `🔄 Статус задачи обновлён:

📌 Проект: ${task.project.title}
📝 Задача: ${savedTask.title}
📄 Описание: ${savedTask.description || '—'}
📅 Срок выполнения: ${savedTask.term || '—'}
🔥 Приоритет: ${savedTask.priority || '—'}
📍 Новый статус: ${statusLabels[savedTask.status]}`;

      await this.notifier.notifyUser(user.telegramChatId, message);
    }

    return savedTask;
  }

  async deleteTask(taskUUID: string, userUUID: string) {
    const task = await this.taskRepository.findOne({
      where: { uuid: taskUUID },
      relations: ['project', 'project.user'],
    });

    if (!task || task.project.user.uuid !== userUUID) {
      throw new NotFoundException('Нет доступа к этой задаче');
    }

    const user = task.project.user;

    const projectTitle = task.project.title;
    const taskTitle = task.title;
    const taskDescription = task.description || '—';
    const taskTerm = task.term || '—';
    const taskPriority = task.priority || '—';

    await this.taskRepository.delete({ uuid: taskUUID });

    if (user && user.telegramChatId) {
      const message = `🗑️ Задача была удалена:

📌 Проект: ${projectTitle}
📝 Задача: ${taskTitle}
📄 Описание: ${taskDescription}
📅 Срок выполнения: ${taskTerm}
🔥 Приоритет: ${taskPriority}`;

      await this.notifier.notifyUser(user.telegramChatId, message);
    }
  }

  async addParticipant(
    projectUUID: string,
    ownerUUID: string,
    participantUUID: string,
  ) {
    const project = await this.projectRepository.findOne({
      where: { uuid: projectUUID, user: { uuid: ownerUUID } },
      relations: ['participants', 'user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const participant = await this.userRepository.findOneBy({
      uuid: participantUUID,
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const alreadyParticipant = project.participants.some(
      (p) => p.uuid === participantUUID,
    );

    if (alreadyParticipant) {
      throw new Error('User is already a participant');
    }

    project.participants.push(participant);
    return this.projectRepository.save(project);
  }

  async transferTask(
    taskUUID: string,
    fromUserUUID: string,
    toUserUUID: string,
  ) {
    const task = await this.taskRepository.findOne({
      where: { uuid: taskUUID },
      relations: ['project', 'owner', 'project.participants', 'project.user'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = task.project;

    if (!task.owner || task.owner.uuid !== fromUserUUID) {
      throw new Error('You are not the owner of this task');
    }

    const isParticipant =
      project.participants.some((p) => p.uuid === toUserUUID) ||
      project.user.uuid === toUserUUID;

    if (!isParticipant) {
      throw new Error('User does not have access to this project');
    }

    const newOwner = await this.userRepository.findOneBy({ uuid: toUserUUID });
    task.owner = newOwner;

    return this.taskRepository.save(task);
  }

  async getProjectUsers(
    projectUUID: string,
    userUUID: string,
  ): Promise<User[]> {
    const project = await this.projectRepository.findOne({
      where: { uuid: projectUUID },
      relations: ['user', 'participants'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const hasAccess =
      project.user.uuid === userUUID ||
      project.participants.some((p) => p.uuid === userUUID);

    if (!hasAccess) {
      throw new NotFoundException('Access denied');
    }

    return [project.user, ...project.participants];
  }
}
