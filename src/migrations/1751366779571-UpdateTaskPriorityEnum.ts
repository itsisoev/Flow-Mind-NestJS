import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTaskPriorityEnum implements MigrationInterface {
  name = 'UpdateTaskPriorityEnum';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "task_priority_enum" RENAME TO "task_priority_enum_old"`,
    );

    await queryRunner.query(`
      CREATE TYPE "task_priority_enum" AS ENUM (
        'very-low', 'low', 'medium', 'high', 'urgent'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "task"
      ALTER COLUMN "priority"
      TYPE "task_priority_enum"
      USING "priority"::text::"task_priority_enum"
    `);
    await queryRunner.query(`DROP TYPE "task_priority_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "task_priority_enum" RENAME TO "task_priority_enum_new"`,
    );

    await queryRunner.query(`
      CREATE TYPE "task_priority_enum" AS ENUM (
        'low', 'medium', 'high'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "task"
      ALTER COLUMN "priority"
      TYPE "task_priority_enum"
      USING "priority"::text::"task_priority_enum"
    `);

    await queryRunner.query(`DROP TYPE "task_priority_enum_new"`);
  }
}
