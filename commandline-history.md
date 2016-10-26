```terminal
mkdir knex-simple-demo
cd knex-simple-demo/
npm init
npm install knex --save
node
```

At this point we explored the query builder aspect of `knex` with no backend.

```terminal
npm install pg --save
cat package.json
nvim simple.js
```

Did the require-and-configure part.

```terminal
createdb knex_demo_music
psql knex_demo_music
```

Created the db and added a table with just SQL.

```terminal
which knex
knex init
knex migrate:make add_albums
knex migrate:make add_sales_to_album
```

I don't know why I made both migration files before running the first one.
Normally you don't do that.

```terminal
nvim migrations/20161025163216_add_albums.js 
mv migrations/20161025164156_add_sales_to_album.js ../
knex migrate:latest
knex migrate:currentVersion
mv ../20161025164156_add_sales_to_album.js migrations/
nvim migrations/20161025164156_add_sales_to_album.js 
ls migrations
knex migrate:rollback
knex help
ls ..
```

See the migration notes, they're more organized than this. You can try cloning this repo and migrating, though you'll need to change the knexfile (or make a user `vaz`).

