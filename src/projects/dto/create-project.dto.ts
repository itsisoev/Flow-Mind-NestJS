import { IsString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class TaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  done: boolean;
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  color: string;

  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => TaskDto)
  // tasks: TaskDto[];
}
