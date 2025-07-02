import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsEnum(['very-low', 'low', 'medium', 'high', 'urgent'])
  priority?: 'very-low' | 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'done'])
  status?: 'todo' | 'in-progress' | 'done';

  @IsOptional()
  @IsDateString()
  term?: string;
}
