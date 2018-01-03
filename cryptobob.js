// main.js
const token = 'INSERT_TELEGRAM_TOKEN_HERE';
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const cheerio = require('cheerio');
const request = require('request');
const Poloniex = require('poloniex-api-node');

const failMessage = `I'm sorry, I'm afraid I can't do that.`;
const bot = new TelegramBot(token, {polling: true}); 
var name = "";
var polo = new Poloniex();

function createReply(message){
	var scriptionary = JSON.parse(fs.readFileSync('scripted.json', 'utf8'));
	var response = `I'm sorry, I'm afraid I can't do that.`;
	if(scriptionary){
		for (let tuple of scriptionary){
			var responses = tuple.res;
			for (let keyword of tuple.kwds.split('|')) {
				if(message.indexOf(keyword) > -1){
					return responses[Math.floor(Math.random() * responses.length)];
				}
			}
		}
	}
	return response;
}


bot.on('text', (msg) => {
  const chatId = msg.chat.id;
  msg_text = msg.text.toLowerCase();
  try{
	if(msg_text.indexOf('cryptobob') > -1){
	  	//XKCD
	  	if(msg_text.indexOf('xkcd') > -1){
	  		request('https://c.xkcd.com/random/comic/', function (err, res, body){
	  			if(!err){
		  			var $ = cheerio.load(body);
		  			var src = 'https:' + $('#comic img').attr('src');
		  			var title = $('#comic img').attr('title');

			  		bot.sendMessage(chatId, `${src}\n${title}`);
			  	}else{
			  		bot.sendMessage(chatId,failMessage);
			  	}
		  	});

		//GREETING
	  	}else if(msg_text.indexOf('hi') > -1 || msg_text.indexOf('hey') > -1){
	  		bot.sendMessage(chatId, `Hi ${msg.from.first_name}, I'm ${name}. bleep bloop.`);
		
	  	//CRYPTOS
		}
		else if(msg_text.indexOf('bitcoin') > -1 
			|| msg_text.indexOf('btc') > -1
			|| msg_text.indexOf('eth') > -1 
			|| msg_text.indexOf('ether') > -1
			|| msg_text.indexOf('coins') > -1 ){
			polo.returnTicker().then((ticker) => {
				bot.sendMessage(chatId, "I fetched the current prices from Poloniex for you!\n" + parseTicker(ticker));
			});
		}else{
			bot.sendMessage(chatId,createReply(msg_text));
		}
	}
	
	}catch (err) {
		bot.sendMessage(chatId,failMessage);
	}
});

function parseTicker(ticker){
	var message = "";
	Object.keys(ticker).forEach(function(key,index) {
		if(key.indexOf('USDT') > -1){
			let change = Number(ticker[key].percentChange);
			let last = Number(ticker[key].last);
			message += key.slice(5, 10) + ":\t" + (change > 0 ? "\u25B2+" : "\u25BC") + change.toFixed(2) + prepend("  ", 6, last.toFixed(2)) + " USDT" + "\n";
		}
	});
	return message;
}

/*only works in fixed-with fonts, not in telegram sadly.*/
function prepend(character, indent, value){
	let rem = value;
	count = 0;
	var str = "";
	while(rem >= 10){
		rem /= 10;
		count++;
	}
	for (var i = 0; i < indent - count; i++){
		str += character;
	}
	return str + value;
}

bot.getMe().then(function (User) {
	name = User.first_name;
});

console.log('Bot started!');