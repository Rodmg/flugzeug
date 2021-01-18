# Flugzeug 2.0.0

- Removed mailgun support for EmailService in favor of generic SMTP configuration
- Refactored Controller to make it easier to extend, added ModelController
- Retired segfault-handler
- Removed unused dependencies
- Code cleanup
- Added .env option to toggle logging to files
- Changed format of responses for Controller
- Add PostgreSQL support on generator
- Add migration auto generation and apply tools (makemigration, migrate)
- Better include support on ModelController queries
- Added attributes option to ModelConroller, useful for policies
- Add Validation to endpoints with Joi

**Breaking Changes:**

- Mailgun support was removed by default (you can still add it manually if you need it by editing `services/EmailService.ts`)
- Controller was refactored, now it is just a basic Controller structure with utility functions for responses, etc.
- All CRUD default functionality was extracted to ModelController, witch extends Controller
- ModelController CRUD functionality was refactored to make it more easily extensible, default handler functions changed name as follows:
  - find -> handleFindAll
  - findOne -> handleFindOne
  - create -> handleCreate
  - update -> handleUpdate
  - delete -> handleDelete
- Also, utility functions in ModelController, like parseWhere, parseLimit, parseOrder, etc, where extracted as exported functions, they are no longer part of the class.

# Flugzeug 1.3.2

- Added "flugzeugVersion" to package.json in generated apps.
- Updated dependencies and fixed audit issues

# Flugzeug 1.3.1

- Fix "Deprecated operator aliases" message from Sequelize
- Standardized and documented supported operators for `where` queries

# Flugzeug 1.3.0

- Add option to chose SQLite or MySQL database on app generator
- Standardize Prettier config for generator project

# Flugzeug 1.2.1

- Fix Typescript error on Controller.ts

# Flugzeug 1.2.0

- Fix building in node v12
- Updated dependencies
- Standardized linting and formatting rules
- Initialize git repo for newly generated project
- Added support for "@/" syntax on imports, for importing from the root of the project (app folder)
- Add new default 404 error view

# Flugzeug 1.1.0

On Saturday, August 3, Flugzeug was updated to update dependencies that had reported vulnerabilities.

## Update instructions

### TLDR

```
npm install -g generator-flugzeug
```

Update your `package.json` like: https://github.com/Rodmg/flugzeug/blob/master/generators/app/templates/package.json.template

Update your `gulpfile.js` like: https://github.com/Rodmg/flugzeug/blob/master/generators/app/templates/gulpfile.js

Update your `app/db.ts` like: https://github.com/Rodmg/flugzeug/commit/d96e1f347bf4953210a7d7069aa1dc5c7f65f763#diff-8ae2a0a37708c921b17ce603d781e483

Update your `app/model/User.ts` like: https://github.com/Rodmg/flugzeug/commit/d96e1f347bf4953210a7d7069aa1dc5c7f65f763#diff-7d074e824c1e0a7554116c190c7b6621

Update your `app/policies/General.ts` like: https://github.com/Rodmg/flugzeug/commit/d96e1f347bf4953210a7d7069aa1dc5c7f65f763#diff-f7ccac3e31cc0f2fb5958ebae7ff1e4e

Upgrade your `app/services/JanitorService.ts` like: https://github.com/Rodmg/flugzeug/commit/d96e1f347bf4953210a7d7069aa1dc5c7f65f763#diff-a061a26dd5f44999e9757211dba2a01f

Check if these changes doesn't affect your code: https://sequelize.org/master/manual/upgrade-to-v5.html

### Detailed changes

Some of those dependency updates included breaking changes, that would need to be backported to your project when upgrading. The main breking changes are:

- **Gulp**: Upgraded to Gulp 4.0.2, this version of gulp involved a big rewrite and changed the way the gulpfile works, **You Will need to upgrade your gulpfile** to make it work with this new version, if you haven't made any changes to the default one, you can just copy the contents from here: [gulpfile.js](https://github.com/Rodmg/flugzeug/blob/master/generators/app/templates/gulpfile.js)

  You can see the changes made here: https://github.com/Rodmg/flugzeug/commit/a1a7983a4b343da237d7d25cd9d6990e2bbe2358

  If you need help upgrading your gulpfile, you can read [this](https://codeburst.io/switching-to-gulp-4-0-271ae63530c0)

- **Sequelize and sequelize-typescript**: Upgraded to Sequelize 5.12.2 and sequelize-typescript 1.0.0-beta.3 This was needed because earlier versions of sequelize-typescript don't support Sequelize 5.

  This involved some changes that you can see here: https://github.com/Rodmg/flugzeug/commit/d96e1f347bf4953210a7d7069aa1dc5c7f65f763

  There may be some other breaking changes that you can get in your app, please refer to: https://sequelize.org/master/manual/upgrade-to-v5.html

  I also found another difference in the way querying associations work with sequelize-typescript:

  If you have a model that has two different associations to a second model, and try to get those associations in an include with the 'as' keyword, it won't work, you need to specify the asociation name in the @HasMany Options. This may be a bug in sequelize-typescript.

  Working Example:

  ```js
  @Table({ tableName: "note" })
  export class Note extends BaseModel<Note> {

    @ForeignKey(() => User)
    @Column
    createdById: number;
    // The second parameter wasn't needed previously
    @BelongsTo(() => User, { as: "createdBy", foreignKey: "createdById" })
    createdBy: User;

    @ForeignKey(() => User)
    @Column
    updatedById: number;
    // The second parameter wasn't needed previously
    @BelongsTo(() => User, { as: "updatedBy", foreignKey: "updatedById" })
    updatedBy: User;

  }

  ...

  const notes = await Note.findAll({
    include: [
      { model: User, as: 'createdBy' },
      { model: User, as: 'updatedBy' }
    ]
  });
  ```

- You will also need to upgrade your package.json to have the new dependency versions, you can see them here: https://github.com/Rodmg/flugzeug/blob/master/generators/app/templates/package.json.template

- There are other minor changes needed to some files, please see the **TLDR** section.
