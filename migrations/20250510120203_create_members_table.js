/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('members', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('gender').notNullable();
    table.date('birth_date').notNullable();
    table.string('purpose').notNullable();
    table.string('phone').notNullable();
    table.integer('remaining_sessions').defaultTo(0);
    table.text('notes');
    table.string('relationship');
    table.json('shared_with').defaultTo('[]');
    table.string('depends_on').nullable();
    table.date('join_date').notNullable();
    table.date('last_visit');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('members');
};
