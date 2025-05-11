/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sessionHistory', function(table) {
    table.increments('id').primary();
    table.integer('member_id').unsigned().notNullable();
    table.datetime('date').notNullable();
    table.text('note');
    table.timestamps(true, true);

    table.foreign('member_id')
      .references('id')
      .inTable('members')
      .onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sessionHistory');
};
