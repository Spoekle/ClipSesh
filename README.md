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
  The app will run on `http://localhost:3000` by default. A MongoDB instance must be reachable at `MONGODB_URI`.
- Type-check:
  ```bash
  npm run typecheck
  ```

### ClipSesh is built using Next.js, React, TailwindCSS, Socket.IO, and MongoDB
[![My Skills](https://skillicons.dev/icons?i=react,tailwind,docker,express,mongodb,typescript,javascript,python)](https://clipsesh.cube.community)
