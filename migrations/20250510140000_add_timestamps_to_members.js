/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('members', function(table) {
    table.timestamp('created_at');
  })
  .then(() => knex('members').update('created_at', knex.fn.now()));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('members', function(table) {
    table.dropColumn('created_at');
  });
}; 