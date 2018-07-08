// const msg = ":sch00lbu5!sch00lbu5@sch00lbu5.tmi.twitch.tv PRIVMSG #ooclanoo :Pretty much";
const msg = ':pyrolok!pyrolok@pyrolok.tmi.twitch.tv PRIVMSG #pyrolok :!pw test';

let tokens = msg.split(':').filter(m => m.length > 0);
// tokens = tokens.splice(0, 1);

console.log('tokens', tokens);

let parts = tokens[0].split(' ').filter(m => m.length > 0);

console.log('parts', parts);

let username = parts[0].split('!')[0];
//let username = usermsg.slice(1, usermsg.length);

let msgType = parts[1];

let channel = parts[2].slice(1, parts[2].length);

let chatMessage = (!!tokens[1]) ? tokens[1] : '';

console.log('username', username);

console.log('chatMessage', chatMessage);

console.log('channel', channel);

console.log('msgType', msgType);


