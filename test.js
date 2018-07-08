var msg = ':little_icky!little_icky@little_icky.tmi.twitch.tv PRIVMSG #saltnp3p :morning chaps';

let tokens = msg.split(':');
console.log(tokens);
let parts = tokens[1].split(' ');

let username = parts[0].split('!')[0];

let msgType = parts[1];

let channel = parts[2].slice(1, parts[2].length);

let chatMessage = tokens[2];

console.log('Username =>', username);

console.log('Type =>', msgType);

console.log('Channel =>', channel);

console.log('Message =>', chatMessage);