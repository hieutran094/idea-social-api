import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageToTopic1650095581392 implements MigrationInterface {
  name = 'AddImageToTopic1650095581392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`topics\` ADD \`image_id\` int NULL AFTER creator_id`);
    await queryRunner.query(`ALTER TABLE \`topics\` ADD UNIQUE INDEX \`IDX_6bbf40502d57cc3b9357d6c915\` (\`image_id\`)`);
    await queryRunner.query(`CREATE UNIQUE INDEX \`REL_6bbf40502d57cc3b9357d6c915\` ON \`topics\` (\`image_id\`)`);
    await queryRunner.query(
      `ALTER TABLE \`topics\` ADD CONSTRAINT \`FK_6bbf40502d57cc3b9357d6c915d\` FOREIGN KEY (\`image_id\`) REFERENCES \`files\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`topics\` DROP FOREIGN KEY \`FK_6bbf40502d57cc3b9357d6c915d\``);
    await queryRunner.query(`DROP INDEX \`REL_6bbf40502d57cc3b9357d6c915\` ON \`topics\``);
    await queryRunner.query(`ALTER TABLE \`topics\` DROP INDEX \`IDX_6bbf40502d57cc3b9357d6c915\``);
    await queryRunner.query(`ALTER TABLE \`topics\` DROP COLUMN \`image_id\``);
  }
}
