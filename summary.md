# knex

> Full notes and demo project: https://raw.githubusercontent.com/vaz/knex-demo
>
> Some highlights from the notes:

Homepage and documentation: http://knexjs.org/

`knex` is a Node package that provides:

- a nicer way to build and execute SQL queries
- support for talking to many different SQL database engines (PostgreSQL, MySQL, MSSSQL, ...)
- database migrations - transitioning schema from one version to another

## requiring knex

```javascript
const knex = require('knex')({ /* configuration */ });
```

## Plain query builder (no client)

Reference: http://knexjs.org/#Builder

With an empty configuration:

```javascript
const knex = require('knex')({})
```

This can be useful if you just want to play with the SQL query builder and see how it works.

In interactive Node:

```node
> const knex = require('knex')({})
> knex.select().toString()
'select *'
> knex.select().from('users').where({ gender: 'm' }).where('age', '>=', 19).limit(1).toString()
'select * from "users" where "gender" = \'m\' and "age" >= 19 limit 1'
```

## schema methods

Reference: http://knexjs.org/#Schema

Schema methods under `knex.schema`, example:

```javascript
knex.schema.table('cats', function (table) {
  table.boolean('grumpy').defaultTo(true)
  // etc.
})
```

## knex configuration: client

Example config using `pg` as the client library:

```javascript
const knex = require('knex')({
  client: 'pg',
  connection: {
    database: 'knex_demo_music',
    user: 'vaz',
    host: 'localhost',
    // password: '...'
  }
});
```

Note, you don't actually `require("pg")`. But you still have to `npm install pg --save`!

## Interfaces (aka actually executing queries)

Reference: http://knexjs.org/#Interfaces

Doesn't execute anything:

```javascript
knex.select().from('artists')
```

Execute by calling `.asCallback`:

```javascript
knex.select().from('artists').asCallback(function (err, result) {
  // handle err, or
  // do something with result
});
```

Note the docs tend to prefer the Promise-style.

## Migrations

Reference: http://knexjs.org/#Migrations

- A migration is a description of changes made to a database,
  to take it from one state (or *version*) to another.

- Migrations describe changes required in both directions, up and down.

- Migrations usually describe *schema changes* rather than *data changes* (in `knex`, like `knex.select()...`) (with some exceptions).

### Don't edit existing migrations!

- Once you've pushed a migration (shared it with collaborators or the public), don't edit it! Make a new migration to make more schema changes.

### knex command

Install `knex` globally for the command:

```terminal
npm install -g knex
```

### knexfile

`knexfile.js` tells the `knex` command how to connect.

Example:

```javascript
module.exports = {

  development: {
    client: 'pg',
    connection: {
      database: 'knex_demo_music',
      user:     'vaz',
      // password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};
```

### knex subcommands

- `knex help`
- `knex init` - create a default `knexfile.js` you can
  then edit with your own settings
- `knex migrate:make <give it a name>` - creates a new migration file using the current timestamp as the filename prefix in the `migrations/` directory (it will create that directory if it doesn't exist).
- `knex migrate:latest` - migrate up to the latest version. You often do this after pulling a project for the first time, during setup; and every time you pull down a new migration thereafter.
- `knex migrate:rollback` - migrate down, or rollback, a single version. Note, this may cause data loss! You are likely dropping tables or columns after all.
- `knex migrate:currentVersion` - show current version (which will be the same as the timestamp prefix of the filename describing it)


### knex migration files

Generate new migration files with `knex migrate:make`. Puts it in `./migrations/`.

Example with implementation:

```javascript
exports.up = function (knex) {
  return knex.schema.createTable('tablename', function (table) {
    // You can use `table` in here to describe changes.
    // Since this is `createTable`, it describes the
    // new table's columns:

    table.increments('id');
    table.string('some_field').notNullable();
    // etc...

  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('tablename');
};
```

Note the **return**, and the lack of `asCallback`/`then`.
