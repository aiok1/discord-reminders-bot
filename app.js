import db from './db.js';
import fs from 'fs';
import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.MODAL_SUBMIT) {
    const userId = req.body.member?.user?.id || req.body.user?.id;

     if (data.custom_id === 'add_all_modal') {
      const rawText = data.components[0].components[0].value;
      const lineslist = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      const insert = db.prepare('INSERT INTO reminders (user_id, text, active) VALUES (?, ?, 1)');
      for (const line of lineslist) {
        insert.run(userId, line);
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            { type: MessageComponentTypes.TEXT_DISPLAY, content: `Added ${lineslist.length} reminders. Yay!` }
          ]
        },
      });
    }
  }
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const userId = req.body.member?.user?.id || req.body.user?.id;


    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `hello world ${getRandomEmoji()}`
            }
          ]
        },
      });
    }
//reminder command
      if (name==='reminder') {
	const userReminders= db.prepare('SELECT * FROM reminders WHERE user_id = ? AND active =1').all(userId);
        const randomid = Math.floor(Math.random() * userReminders.length);
	const random= userReminders[randomid];

	return res.send({
	  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
	  data: {
	    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
	    components: [
	      {
		type: MessageComponentTypes.TEXT_DISPLAY,
		content: `${random.id}: ${random.text}`
	      }
	     ]
	   },
	 });
       }

   


  // add and delete commands
  if (name==='retire') {
    const options = data.options;
    const idToRetire = options.find(opt => opt.name === 'id').value;
    const fileData = db.prepare('SELECT * FROM reminders WHERE user_id= ? AND active = 1').all(userId);
    const reminder = fileData.find(r => r.id ===idToRetire);
    if (!reminder) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: InteractionResponseFlags.IS_COMPONENTS_V2, components: [
          { type: MessageComponentTypes.TEXT_DISPLAY, content: `No reminder found with id ${idToRetire}` }
        ]},
      });
    }
    reminder.active = false;
    db.prepare('UPDATE reminders set active=0 WHERE id= ?').run(idToRetire);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: InteractionResponseFlags.IS_COMPONENTS_V2, components: [
        { type: MessageComponentTypes.TEXT_DISPLAY, content: `Deleted: "${reminder.text}"` }
      ]},
    });
  }

  if (name === 'add') {
    const options = data.options;
    const newText = options.find(opt => opt.name === 'text').value;

    const fileData = db.prepare('SELECT * FROM reminders WHERE user_id=? AND active=1').all(userId);
    const result=db.prepare('INSERT INTO reminders (user_id, text, active) VALUES (?,?,1)').run(userId,newText);
    const newId= result.lastInsertRowid
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { flags: InteractionResponseFlags.IS_COMPONENTS_V2, components: [
        { type: MessageComponentTypes.TEXT_DISPLAY, content: `Added reminder #${newId}: "${newText}"` }
      ]},
    });
  }
  
  if (name === 'add_all') {
    return res.send({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: 'add_all_modal',
      title: 'add multiple reminders',
      components: [
        {
          type: 1, 
          components: [
            {
              type: 4, 
              custom_id: 'reminders_text',
              style: 2, // paragraph
              label: 'paste reminders one per line',
              required: true,
              max_length: 4000,
            }
          ]
        }
      ]
    },
  });
} 


 console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
}

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });

 });

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
