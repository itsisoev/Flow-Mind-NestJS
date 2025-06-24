import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      relations: ['user'],
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }
    return project;
  }
}
