import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

export type TaskPriority = 'very-low' | 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  title: string;

  @Column({ default: false })
  done: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: ['very-low', 'low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  term?: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  project: Project;
}
