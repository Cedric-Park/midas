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
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await knex.destroy();
  }
}

migrateAppointmentsTimestamps(); 