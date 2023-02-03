import { create } from "venom-bot";
import * as dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

create({
  session: "whatsapp-bot",
  multidevice: true,
})
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

const configuration = new Configuration({
  organization: process.env.ORGANIZATION_ID,
  apiKey: process.env.OPENAI_KEY,
});

const BOT_NUMBER = process.env.PHONE_NUMBER;

const openai = new OpenAIApi(configuration);

const getDavinciResponse = async (clientText) => {
  const options = {
    model: "text-davinci-003",
    prompt: clientText,
    temperature: 1,
    max_tokens: 4000,
  };

  try {
    const response = await openai.createCompletion(options);
    let botResponse = "";
    response.data.choices.forEach(({ text }) => {
      botResponse += text;
    });
    return `Whatsapp BOT.\n\n ${botResponse.trim()}`;
  } catch (e) {
    return `❌ OpenAI Response Error: ${e.response.data.error.message}`;
  }
};

const getDalleResponse = async (clientText) => {
  const options = {
    prompt: clientText,
    n: 1,
    size: "1024x1024",
  };

  try {
    const response = await openai.createImage(options);
    return response.data.data[0].url;
  } catch (e) {
    return `❌ OpenAI Response Error: ${e.response.data.error.message}`;
  }
};

const commands = (client, message) => {
  const iaCommands = {
    davinci3: "./search",
    dalle: "./img",
    shutdown: "./shutdown",
  };

  let mensagem = message.text;
  let usuario = message.from;
  let firstWord = mensagem.substring(0, mensagem.indexOf(" "));

  if (message.isGroupMsg) return;

  if (mensagem.substring(0, 2) === "./") {
    switch (firstWord) {
      case iaCommands.davinci3:
        const question = mensagem.substring(message.text.indexOf(" "));
        getDavinciResponse(question).then((response) => {
          client.sendText(
            message.from === BOT_NUMBER ? usuario : message.from,
            response
          );
        });
        break;

      case iaCommands.dalle:
        const imgDescription = mensagem.substring(message.text.indexOf(" "));
        getDalleResponse(imgDescription, message).then((imgUrl) => {
          client.sendImage(
            message.from === BOT_NUMBER ? usuario : message.from,
            imgUrl,
            imgDescription,
            "Imagem gerada pela IA DALL-E 🤖"
          );
        });
        break;
    }
  }

  if (usuario === BOT_NUMBER && mensagem === iaCommands.shutdown) {
    process.exit(0);
  }
};

async function start(client) {
  client.onAnyMessage((message) => commands(client, message));
}
