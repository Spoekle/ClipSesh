# Welcome to ClipSesh!

## About
ClipSesh is a tool developed by Spoekle that is used by Cube Community Staff to review highlight clips.

This tool has been divided in 3 parts:
- A Frontend
- A Backend
- Discord Bot

The frontend is based on a React web application, together with TailwindCSS, this has been styled in a minimalistic way.

## Contributing
If you decide you want to help with the development with ClipSesh, feel free to open a pull request. To start developing you can follow these steps:
- Make sure you have npm/nodejs and python installed
- Fill in all .env and config files with the needed information
  
## To run the whole stack, follow these steps
### Running both the frontend and the backend at once?
- Make sure all `.env` files are filled out.
- Run the `setup.bat` file and follow the instructions in the terminal.
### Frontend
- Fill in the `.env` file withe the backend url.
- Run `npm run dev` to start the Vite environment, this will run on port `5173` by default, but will show you the port when it starts.

### Backend
- Fill in the `.env` file with what you need, I still recommend filling in everything.
- Run `npm run dev` to start the dev environment.
- Note the admin credentials from the terminal, as these will be needed to login.

### Clipsesh is built using React.js, TailwindCSS, Docker, Express.js and MongoDB
[![My Skills](https://skillicons.dev/icons?i=react,tailwind,docker,express,mongodb,typescript,javascript,python)](https://clipsesh.cube.community)
