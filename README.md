# Welcome to ClipSesh!

## About
ClipSesh is a tool developed by Spoekle that is used by Cube Community Staff to review highlight clips.

It runs as a single Node.js server (`server.ts`) that hosts the Next.js app and API, Socket.IO, the Discord bot, and the season scheduler.

## Contributing
If you decide you want to help with the development of ClipSesh, feel free to open a pull request. To start developing:
- Make sure you have Node.js and npm installed
- Copy `.env.example` to `.env` and fill in necessary configuration
  
## Running the Application
- Install dependencies:
  ```bash
  npm install
  ```
- Run the development server:
  ```bash
  npm run dev
  ```
  The app will run on `http://localhost:3000` by default. A Postgres database must be reachable at `DATABASE_URL`; pending migrations in `drizzle/` are applied automatically on startup.
- Type-check:
  ```bash
  npm run typecheck
  ```

## Database
ClipSesh uses Postgres with [Drizzle ORM](https://orm.drizzle.team). The schema lives in `src/db/schema.ts`.
- After changing the schema, generate a migration (and commit the files in `drizzle/`):
  ```bash
  npm run db:generate
  ```
- Migrations run automatically when the server starts; `npm run db:migrate` applies them manually.

### Migrating from MongoDB
`npm run db:migrate-mongo` copies everything from the old MongoDB database (`MONGODB_URI`) into Postgres (`DATABASE_URL`), keeping all ids. It runs in a single transaction and prints a per-table report.
- Rehearse first; this imports everything and then rolls back:
  ```bash
  npm run db:migrate-mongo -- --dry-run
  ```
- Run it for real (add `--yes` if Postgres already has data you want replaced):
  ```bash
  npm run db:migrate-mongo
  ```

### ClipSesh is built using Next.js, React, TailwindCSS, Socket.IO, and PostgreSQL
[![My Skills](https://skillicons.dev/icons?i=react,tailwind,docker,express,postgres,typescript,javascript,python)](https://clipsesh.cube.community)
