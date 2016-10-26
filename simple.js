const knex = require('knex')({
  client: 'pg',
  connection: {
    database: 'knex_demo_music',
    user: 'vaz',
    host: 'localhost',
    // password: '...'
  }
});


// knex.select('name').from('artists').asCallback(function (err, result) {
//   if (err) { throw err; }

//   console.log(result[0]['name']);
// });


knex.schema.createTable('albums', function (table) {

  table.increments('id');
  table.string('title', 50).notNullable();
  table.integer('year').notNullable();
  table.integer('artist_id').references('artists.id').onDelete('cascade');
  table.timestamps();

});



