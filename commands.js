import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';

const REMINDER_COMMAND = {
  name: 'reminder',
  description: 'useful remidner ping',
  type: 1,
  integration_types: [0,1],
  contexts: [0,1,2],
};

const RETIRE_COMMAND = {
  name: 'retire',
  description: 'retire reminder by id',
  options: [
    {
      type: 4, // INTEGER
      name: 'id',
      description: 'The ID of the reminder to retire',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ADD_COMMAND = {
  name: 'add',
  description: 'add new reminder',
  options: [
    {
      type: 3, // STRING
      name: 'text',
      description: 'The reminder text',
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

//command to input multiple reminders at a time, separated by \n
const ADD_ALL_COMMAND = {
  name: 'add_all',
  description: 'add multiple reminders at a time, paste all separated by line breaks',
  type: 1,
  integration_types: [0,1],
  contexts: [0,1,2],
};


const ALL_COMMANDS = [REMINDER_COMMAND, RETIRE_COMMAND, ADD_COMMAND, ADD_ALL_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);

//InstallGuildCommands(process.env.APP_ID, process.env.GUILD_ID, ALL_COMMANDS);

