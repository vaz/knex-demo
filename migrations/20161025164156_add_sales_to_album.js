
exports.up = function(knex, Promise) {
  return knex.schema.table('albums', function (table) {
    table.integer('sales').default(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('albums', function (table) {
    table.dropColumn('sales');
  });
  
};
