import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Task } from './entities/task.entity';
import { TgBotModule } from '../tg-bot/tg-bot.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    forwardRef(() => TgBotModule),
    TypeOrmModule.forFeature([Project, User, Task]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, TasksService],
  exports: [ProjectsService, TasksService],
})
export class ProjectsModule {}
