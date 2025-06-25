import { IsString } from 'class-validator';

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
