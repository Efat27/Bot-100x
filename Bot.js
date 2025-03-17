const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "7002219880:AAETTv4_M6p-QER6TjIUcE3w27Tm3_twxoc"; // Replace with your bot token
const bot = new TelegramBot(token, { polling: true });

const responsesFile = "responses.json";
const commandsFile = "commands.json";

let responses = {};
let commands = {};

// Load stored responses
if (fs.existsSync(responsesFile)) {
  responses = JSON.parse(fs.readFileSync(responsesFile, "utf8"));
}

// Load stored commands
if (fs.existsSync(commandsFile)) {
  commands = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
}

// Save data to JSON files
function saveResponses() {
  fs.writeFileSync(responsesFile, JSON.stringify(responses, null, 2));
}

function saveCommands() {
  fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));
}

// Function to remove emojis from text
function removeEmojis(text) {
  return text.replace(/\p{Emoji}/gu, "").trim();
}

// Teach system: /teach [input] - [response]
bot.onText(/^\/teach (.+) - (.+)/, (msg, match) => {
  const input = removeEmojis(match[1].trim()); // Remove emojis from input
  const response = match[2].trim();

  if (!input) {
    bot.sendMessage(msg.chat.id, "Invalid input after removing emojis.");
    return;
  }

  responses[input] = response;
  saveResponses();
  bot.sendMessage(msg.chat.id, `Learned: "${input}" → "${response}"`);
});

// Respond based on learned data
bot.on("message", (msg) => {
  if (!msg.text) return; // Ignore non-text messages

  let text = msg.text.trim();

  // Ignore bot commands
  if (text.startsWith("/")) return;

  // Remove emojis from text
  text = removeEmojis(text);

  if (responses[text]) {
    bot.sendMessage(msg.chat.id, responses[text]);
  }
});

// Install a command: /cmd install [cmd name] [type code]
bot.onText(/^\/cmd install (\S+) (.+)/, (msg, match) => {
  const cmdName = match[1].trim();
  const cmdCode = match[2].trim();

  commands[cmdName] = cmdCode;
  saveCommands();
  bot.sendMessage(msg.chat.id, `Command "${cmdName}" installed.`);
});

// Delete a response: /cmd del [input]
bot.onText(/^\/cmd del (.+)/, (msg, match) => {
  const input = removeEmojis(match[1].trim());

  if (responses[input]) {
    delete responses[input];
    saveResponses();
    bot.sendMessage(msg.chat.id, `Deleted: "${input}"`);
  } else {
    bot.sendMessage(msg.chat.id, `"${input}" not found.`);
  }
});

// Load all responses: /cmd loadall
bot.onText(/^\/cmd loadall/, (msg) => {
  const allResponses = Object.entries(responses)
    .map(([input, response]) => `${input} → ${response}`)
    .join("\n");

  bot.sendMessage(msg.chat.id, allResponses || "No responses stored.");
});

console.log("Bot is running...");
