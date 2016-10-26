# knex

Homepage and documentation: http://knexjs.org/

`knex` is a Node package that provides:

- a nicer way to build and execute SQL queries
- support for talking to many different SQL database engines (PostgreSQL, MySQL, MSSSQL, ...)
- database migrations - transitioning schema from one version to another

Also:

- it only works for SQL (relational) databases (not Mongo, etc)
- it wraps low-level client libraries like `pg` to talk to database servers, but you can use it without a client library too
- comes with a CLI command `knex` (for managing migrations)

To install it for a project:

```terminal
npm install knex --save
```

## requiring knex

[In the docs](http://knexjs.org/#Installation-client) you'll see knex being required in a form like this:

```javascript
const knex = require('knex')({ /* configuration */ });
```

That is, when you `require('knex')`, it doesn't really give you the `knex` object you want to work with, it gives you a function used to build the `knex` object you want. That function takes a configuration (object) as an argument. It's nothing magical, just a shortcut for something like:

```javascript
const config = { /* configuration here */ };
const makeKnex = require('knex');
const knex = makeKnex(config);
```

## Plain query builder (no client)

Reference: http://knexjs.org/#Builder

An empty configuration means there's no client library, thus no database server to talk to.

```javascript
const knex = require('knex')({})
```

This can be useful if you just want to play with the SQL query builder and see how it works.

In interactive Node:

```node
> const knex = require('knex')({})
undefined
> knex.select()
Builder { ...<some output omitted>... }
> knex.select().toString()
'select *'
> knex.select().from('users')
Builder { ...<some output omitted>... }
> knex.select().from('users').toString()
'select * from "users"'
> knex.select().from('users').limit(1).toString()
'select * from "users" limit 1'
> knex.select().from('users').where('age', '>=', 19).limit(1).toString()
'select * from "users" where "age" > 18 limit 1'
> knex.select().from('users').where({ gender: 'm' }).where('age', '>=', 19).limit(1).toString()
'select * from "users" where "gender" = \'m\' and "age" >= 19 limit 1'
```

As we see here, the query building methods return a `Builder` object. You can keep chaining query building methods to continue building the same query. You can call `toString()` on a `Builder` (meaning at any point along the chain) to see the SQL it would produce.

(Note: depending on the configured client, some SQL may change slightly, since not every database engine implements SQL exactly the same way.)

(Note 2: `knex.select()` is the same as `knex.select("*")`)

When you chain methods like this, each method call modifies the query you're building, adding more clauses or modifying existing clauses.

There are several ways to specify where-clauses:

- `.where('name', 'joe')` produces `WHERE "name" = "joe"`
- `.where('age', 20)` produces `WHERE "age" = 20`
- `.where('age', '>', 20)` produces `WHERE "age" > 20`
- `.where({ age: 20 })` is the same as `.where('age', 20)`
- `.where({ age: 20, dollars: 4 }` produces `WHERE "age" = 20 and "dollars" = 4`

See the docs for more examples, and variations on `.where` like `.whereNot`. Also see `.join`, `.having` and others that specify conditions the same way.

## schema methods

Reference: http://knexjs.org/#Schema

Examples:

Create table:

```javascript
knex.schema.createTable('cats', function (table) {
  table.string('name').notNullable();
  table.integer('legs_scratched').defaultTo(0)
  // etc.
})
```

Modify table:

```javascript
knex.schema.table('cats', function (table) {
  table.boolean('grumpy').defaultTo(true)
  // etc.
})
```

Drop table:

```javascript
knex.schema.dropTable('cats');
```

See more in the docs.


## knex configuration: client

Quick review first:

- most database engines follow a client/server model
- various kinds of clients can connect to the database server, including command-line clients (like `psql`), GUI clients, or any app using a client library
- the `pg` package you've been using to interact with PostgreSQL is a client library. It's fairly low-level, meaning more emphasis is on client correctness and completeness than on usability (as you may have noticed...).

Knex can be configured with a "client", meaning a client library. With a client and valid connection settings, knex is able to actually execute queries.

Knex can use the `pg` client library (that you were just using) as its "client", as well as many other client libraries supporting MySQL, MSSQL, etc.
An example configuration using `pg` is provided further down.

Here's an example configuration, used in this demo project:

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

Note, you don't actually `require("pg")`. But you still have to `npm install pg --save`! Knex is going to require it somewhere in its own code.


## Interfaces (aka actually executing queries)

Reference: http://knexjs.org/#Interfaces

Once you have a configuration with a real backend,
you'll want to execute queries, not just build them.

There are multiple ways. I'll describe two here briefly.

See the docs for more.

### Callbacks and promises

The following code would not execute anything against the database:

```javascript
knex.select().from('artists')
```

Why?

1. Because knex syntax is about chaining together methods. Maybe you
   want to chain more methods onto this before executing.

2. Because making database queries is an async operation.

As usual, for async we can use callbacks. However, you'll see
a different syntax, Promise-based syntax, in most of knex
documentation.

Here's how the two look side by side.

Callbacks:

```javascript
knex.select().from('artists').asCallback(function (err, result) {

  // handle err, or
  // do something with result

  // do a second query
  knex.select().from('albums').asCallback(function (err, result) {

    // handle err, or
    // do something with second result

  });
});
```

Promises:

```javascript
knex.select().from('artists').then(function (result) {

  // do something with result

  return knex.select()... // do a second query

}).then(function (result) {

  // do something with second result

}).catch(function (err) {

  // handle err (from either query)
});
```

Either way, you're dealing with results or potential errors.

But the way you chain multiple async calls together varies a lot.


Note: we briefly saw jQuery's promise interface for methods
like `$.ajax`; it's worth pointing out that for jQuery the methods
were `then`/`fail` instead of `then`/`catch`. `then`/`catch` is more
widely accepted but jQuery doesn't support calling it `catch`.


## Migrations

Reference: http://knexjs.org/#Migrations

- A migration is a description of changes made to a database,
  to take it from one state (or *version*) to another.

- Migrations describe changes required in both directions.

  So, a migration describing the 4th version of the database
  schema will contain a description of changes to make

  - to transform the 3rd version to the 4th version (we call this **migrating up**)
  - to transform the 4th version back to the 3rd version (we call this **migrating down** or **rolling back**)

- Migrations usually describe *schema changes* (like the methods in `knex.schema`, like `knex.schema.createTable(...)`) rather than *data changes* (in `knex`, like `knex.select()...`).

  (However, sometimes data changes might be described too. Maybe you've added a new column, and want to fill it with some calculated value, for each existing row in the database. Pure "data migrations" are possible too. Both of these are rarely what we mean by "migrations": it's usually all about schema.)

- Migrations are meant to be committed and pushed (shared with collaborators). The whole point is to be able to keep your database schemas in sync.

- We typically start using migrations from the very beginning. So version 0 is an empty database, and we migrate up from there.

### Don't edit existing migrations!

- Once you've pushed a migration (shared it with collaborators or the public), don't edit it!

  If someone has applied the migration before your edits were made, *they will not be able to migrate those changes*, because as far as knex is concerned, they already have. Once we've migrated to a version, we can't redo this migrations unless we rollback and migrate again (which usually means loss of data, and it breaks the workflow for everyone). You'll get scolded. So don't do it!

- To make more changes, make a new migration! This is almost always the correct answer. Even if you haven't pushed it yet, it doesn't hurt to do it this way.

  A new migration might add another column to a table you made in an earlier migration. Or it might drop a table you created a while back. Or change a column's name because of a typo--
  even that can and usually should be a new migration.

### knex command

To get the `knex` CLI command, install knex globally (this is done in addition to installing it locally for the project):

```terminal
npm install -g knex
```

To be really clear: you probably already ran `npm install knex --save`. That's good, but installing globally is different and you need to do this too (just once though, not once per project). Only the global install (`-g`) gives you the `knex` command.

(Technically that's not totally true, you can find a `knex` executable command somewhere in the project's `node_modules/`, but it's way less handy.)

### knexfile

Now, just like how you pass a configuration to knex when
you use it in your Node code, this CLI command version of
knex needs a configuration. It gets this from a "knexfile".
You can create a default knexfile with:

```terminal
knex init
```

Have a look at the `knexfile.js` it creates. Multiple
configurations can be set, in case you need to manage
databases in different environments (local development
machine vs live production server, for example). For
development, it's enough to just have a `development`
config.

Set it up for pg. Here's mine:

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

Now when you run the `knex` command, it knows what
database to use.

### knex subcommands

- `knex help`
- `knex init` - create a default `knexfile.js` you can
  then edit with your own settings
- `knex migrate:make <give it a name>` - creates a new migration file using the current timestamp as the filename prefix in the `migrations/` directory (it will create that directory if it doesn't exist).
- `knex migrate:latest` - migrate up to the latest version. You often do this after pulling a project for the first time, during setup; and every time you pull down a new migration thereafter.
- `knex migrate:rollback` - migrate down, or rollback, a single version. Note, this may cause data loss! You are likely dropping tables or columns after all.
- `knex migrate:currentVersion` - show current version (which will be the same as the timestamp prefix of the filename describing it)


### knex migration files

A migration file, created with `knex migrate:make ...`, originally looks like this:

```javascript

exports.up = function (knex, Promise) {

};

exports.down = function (knex, Promise) {

};
```

Notes:

- `up` is a function that returns a knex query describing the changes to make when migration *to* this version
- `down` is a function that returns a knex query describing the changes to make when rolling back this version
- `down` should undo the changes described in `up`. If `up` returns a "CREATE TABLE" type query, then `down` should return a "DROP TABLE" type query.
- You don't really need to worry about the Promise arg. In fact you can remove it from the args, if you want.

  (`Promise` is actually a global object now anyway if you did want it. It's used to manually make new promises and certain other operations on promises. This is out of scope for now.)

- You need to **return the query** method chain, *excluding* the `.asCallback(...)` or `.then(...)`. (knex will execute the query for you.)

  For example:

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
  ```

  Note the **return**, and the lack of `asCallback`/`then`.


