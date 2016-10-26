

exports.up = function(knex, Promise) {
  return knex.schema.createTable('albums', function (table) {

    table.increments('id');
    table.string('title', 50).notNullable();
    table.integer('year').notNullable();
    table.integer('artist_id'); // .references('artists.id').onDelete('cascade');
    table.timestamps();

  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('albums');
};
