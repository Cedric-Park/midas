const knex = require('./src/db/knex');

async function migrateAppointmentsTimestamps() {
  try {
    console.log('Adding updated_at to appointments table if not exists...');
    const hasUpdatedAt = await knex.schema.hasColumn('appointments', 'updated_at');
    if (!hasUpdatedAt) {
      await knex.schema.table('appointments', function(table) {
        table.timestamp('updated_at');
      });
      await knex('appointments').update('updated_at', knex.fn.now());
      console.log('updated_at column added and initialized.');
    } else {
      console.log('updated_at column already exists. Nothing to do.');
    }

    console.log('Ensuring id column is AUTOINCREMENT PRIMARY KEY...');
    const tableInfo = await knex('sqlite_master').where({ type: 'table', name: 'appointments' }).first();
    if (tableInfo && tableInfo.sql && !/id INTEGER PRIMARY KEY AUTOINCREMENT/i.test(tableInfo.sql)) {
      await knex.raw('ALTER TABLE appointments RENAME TO appointments_old');
      await knex.schema.createTable('appointments', function(table) {
        table.increments('id').primary();
        table.string('memberId');
        table.timestamp('start');
        table.timestamp('end');
        table.string('status');
        table.timestamp('updated_at');
      });
      await knex.raw(`INSERT INTO appointments (id, memberId, start, end, status, updated_at)
        SELECT id, memberId, start, end, status, updated_at FROM appointments_old`);
      await knex.schema.dropTable('appointments_old');
      console.log('id column updated to AUTOINCREMENT PRIMARY KEY.');
    } else {
      console.log('id column is already AUTOINCREMENT PRIMARY KEY. Nothing to do.');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await knex.destroy();
  }
}

migrateAppointmentsTimestamps(); 