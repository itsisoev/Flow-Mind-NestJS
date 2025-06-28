import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { IUser } from 'src/users/users.interface';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UsersService } from '../../users/users.service';
import { ProjectsService } from '../../projects/projects.service';
import { JwtService } from '@nestjs/jwt';
import { CreateTaskDto } from '../../projects/dto/create-task.dto';
import { Context } from 'telegraf';

@Injectable()
export class TgBotService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<IUser> {
    return this.authService.validateUser(username, password);
  }

  async login(user: IUser) {
    return this.authService.login(user);
  }

  async createUser(dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  async getProjects(userUUID: string) {
    return this.projectsService.findAllByUser(userUUID);
  }

  async getTasks(projectUUID: string, userUUID: string) {
    return this.projectsService.findTasksByProject(projectUUID, userUUID);
  }

  async createProject(
    createProjectDto: { title: string; color: string },
    userUUID: string,
    ctx: Context,
  ) {
    const project = await this.projectsService.create(
      createProjectDto,
      userUUID,
    );
    await ctx.reply(`✅ Новый проект создан: "${project.title}"`);
    return project;
  }

  async addTaskToProject(
    projectUUID: string,
    userUUID: string,
    taskDto: CreateTaskDto,
    ctx: Context,
  ) {
    const task = await this.projectsService.addTaskToProject(
      projectUUID,
      userUUID,
      taskDto,
    );

    await ctx.reply(`✅ Новая задача добавлена в проект:\n
📝 Заголовок: ${task.title}
📄 Описание: ${task.description || '—'}
📅 Срок: ${task.term || '—'}
🔥 Приоритет: ${task.priority || '—'}`);

    return task;
  }

  async saveTelegramChatId(userUUID: string, chatId: number) {
    const user = await this.usersService.findByUUID(userUUID);
    if (!user) throw new NotFoundException('User not found');
    user.telegramChatId = chatId;
    await this.usersService.update(user);
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
