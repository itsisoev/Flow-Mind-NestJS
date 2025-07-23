import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { TelegramNotifierService } from 'src/tg-bot/services/telegram-notifier.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly projectsService: ProjectsService,
    private readonly notifier: TelegramNotifierService,
  ) {}

  async addTaskToProject(
    projectUUID: string,
    userUUID: string,
    taskDto: CreateTaskDto,
  ): Promise<Task> {
    const project = await this.projectsService.findOneByUuidAndUser(
      projectUUID,
      userUUID,
    );
    const owner = await this.userRepository.findOneBy({ uuid: userUUID });

    const newTask = this.taskRepository.create({
      ...taskDto,
      project,
      owner,
    });

    const savedTask = await this.taskRepository.save(newTask);

    if (owner?.telegramChatId) {
      const message = `✅ Новая задача добавлена в проект "${project.title}":
📝 Заголовок: ${savedTask.title}
📄 Описание: ${savedTask.description || '—'}
📅 Срок: ${savedTask.term || '—'}
🔥 Приоритет: ${savedTask.priority || '—'}`;
      await this.notifier.notifyUser(owner.telegramChatId, message);
    }

    return savedTask;
  }

  async findTasksByProject(
    projectUUID: string,
    userUUID: string,
  ): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .leftJoin('task.owner', 'owner')
      .where('project.uuid = :projectUUID', { projectUUID })
      .andWhere('owner.uuid = :userUUID', { userUUID })
      .getMany();
  }

  async updateTaskStatus(
    taskUUID: string,
    done: boolean,
    status?: string,
    userUUID?: string,
  ) {
    const task = await this.ensureTaskOwner(taskUUID, userUUID);

    task.done = done;

    if (status && ['todo', 'in-progress', 'done'].includes(status)) {
      task.status = status as TaskStatus;
    }

    const savedTask = await this.taskRepository.save(task);

    if (task.owner?.telegramChatId) {
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

      await this.notifier.notifyUser(task.owner.telegramChatId, message);
    }

    return savedTask;
  }

  async deleteTask(taskUUID: string, userUUID: string) {
    const task = await this.ensureTaskOwner(taskUUID, userUUID);

    await this.taskRepository.delete({ uuid: taskUUID });

    if (task.owner?.telegramChatId) {
      const message = `🗑️ Задача была удалена:

📌 Проект: ${task.project.title}
📝 Задача: ${task.title}
📄 Описание: ${task.description || '—'}
📅 Срок выполнения: ${task.term || '—'}
🔥 Приоритет: ${task.priority || '—'}`;

      await this.notifier.notifyUser(task.owner.telegramChatId, message);
    }
  }

  async transferTask(
    taskUUID: string,
    fromUserUUID: string,
    toUserUUID: string,
  ) {
    const task = await this.ensureTaskOwner(taskUUID, fromUserUUID);

    const newOwner = await this.userRepository.findOneBy({ uuid: toUserUUID });
    if (!newOwner) throw new NotFoundException('Новый владелец не найден');

    task.owner = newOwner;
    return this.taskRepository.save(task);
  }

  private async ensureTaskOwner(
    taskUUID: string,
    userUUID: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { uuid: taskUUID },
      relations: ['owner', 'project'],
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }
    if (!task.owner) {
      throw new NotFoundException('Задача не имеет владельца');
    }
    if (task.owner.uuid !== userUUID) {
      throw new NotFoundException('Нет доступа к задаче');
    }

    return task;
  }
}
