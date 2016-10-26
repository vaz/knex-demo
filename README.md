# knex

- is a query builder
- is higher-level than a package like `pg`
- can use many backends (`pg` is one, there are backends
  for MySQL, MSSQL and many others as well)
- comes with a CLI command `knex` (for managing migrations)

## Plain query builder, no backend

When you `require('knex')`, what you get back is a function
used to configure knex for the current app. The docs usually show a specific incantation where this function is called immediately as it's required, instead of assigning it to a variable. For example:

```javascript
const knex = require('knex')({})
```

This gives us a `knex` object with no backend (because the configuration is `{}`, an empty object).

"No backend" means we can use the query building methods of knex, but we don't have a database to execute it against.

One thing this is useful for is for experimenting with the
syntax in interactive node:

```node
> const knex = require('knex')({})
undefined

> knex.select().from("users")
Builder { ...snip... }

> knex.select().from("users").toString()
'select "name", "age" from "users"'
```

As we see here, the query building methods return a `Builder` object. You can keep chaining query building methods to continue building the same query. You can call `toString()` on a `Builder` (meaning at any point along the chain) to see the SQL it would produce.

(Note: depending on the backend, some SQL may change slightly, since not every backend implements SQL exactly the same)

(Note 2: `knex.select()` is the same as `knex.select("*")`)

"Chain?" What does it mean?

```node
> knex.select('name', 'age').from('users').where('age', '>', 18).toString()
'select "name", "age" from "users" where "age" > 18'
```

It composes in a similar order to actual SQL.

Notice the `where(...)`. There are several ways to specify where-clauses:

- `.where('name', 'joe')` produces `WHERE "name" = "joe"`
- `.where('age', 20)` produces `WHERE "age" = 20`
- `.where('age', '>', 20)` produces `WHERE "age" > 20`
- `.where({ age: 20 })` is the same as `.where('age', 20)`
- `.where({ age: 20, dollars: 4 }` produces `WHERE "age" = 20 and "dollars" = 4`

See the docs for more, and variations on `.where` like `.whereNot`.


## schema methods

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

Etc...

See the rest under "Schema Builder" section of the docs.


## Actual configuration (example)

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

## Interfaces (aka actually executing queries)

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

Here's how the two look side by side:

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

```terminal
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


