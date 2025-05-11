/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('appointments_new', function(table) {
      table.increments('id').primary();
      table.string('memberId', 7).references('id').inTable('members');
      table.string('start').notNullable();
      table.string('end').notNullable();
      table.string('status').notNullable().defaultTo('scheduled');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      return knex('appointments').select('*');
    })
    .then((appointments) => {
      return knex('appointments_new').insert(appointments);
    })
    .then(() => {
      return knex.schema.dropTable('appointments');
    })
    .then(() => {
      return knex.schema.renameTable('appointments_new', 'appointments');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .createTable('appointments_old', function(table) {
      table.string('id').primary();
      table.string('memberId', 7).references('id').inTable('members');
      table.string('start').notNullable();
      table.string('end').notNullable();
      table.string('status').notNullable().defaultTo('scheduled');
    })
    .then(() => {
      return knex('appointments').select('*');
    })
    .then((appointments) => {
      return knex('appointments_old').insert(appointments);
    })
    .then(() => {
      return knex.schema.dropTable('appointments');
    })
    .then(() => {
      return knex.schema.renameTable('appointments_old', 'appointments');
    });
}; 