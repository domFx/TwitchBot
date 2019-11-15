import express from 'express';
import { createServer, Server } from 'http';
const ws = require('ws');
const fs = require('fs');

import { Credentials } from './credentials';
import { Chat } from './chat';

export class TwitchBot {
    w: WS;
    app: express.Application;
    server: Server;

    username: string = '';
    password: string = '';

    // channel: string = 'ooclanoo';
    channel: string = 'domfx';

    lastQueuePopTime: Date;
    
    constructor() {
        this.username = Credentials.user; 
        this.password =  Credentials.password;

        this.app = express();
        this.server = createServer(this.app);

        this.server.listen(8000);

        this.w = new ws('wss://irc-ws.chat.twitch.tv:443');

        this.w.on('open', () => this.onOpen());
        
        this.w.on('close', () => this.onClose());
        
        this.w.on('message', (msg) => this.onMessage(msg));
    }

    private onOpen(): any {
        console.log('Connecting');
        if(this.w.readyState === this.w.OPEN) {
            this.w.send(`CAP REQ :twitch.tv/tags`);

            console.log('Connected');
            this.w.send(`PASS ${this.password}`);
            this.w.send(`NICK ${this.username}`);
            this.w.send(`JOIN #${this.channel}`);
            //this.w.send(`PRIVMSG #${this.channel} Connected`);
        }
    }

    private onMessage(msg: string): any {   
        // Keep alive
        if(msg === 'PING :tmi.twitch.tv') {
            this.w.send('PONG :tmi.twitch.tv');
        } else {
            console.log(msg);
            if(msg.indexOf('PRIVMSG') >= 0) {
                try {
                    let r = this.parseMessage(msg);
                    this.commandHandler(r);
                } catch {
                    console.log('Unable to parse message', msg);
                }
            }
        }
    }

    private onClose(): any {
        console.log('Connection Closed');
    }

    queue: string[] = [];
    
    commandHandler(chat: Chat) {
        const words = chat.chatMessage.split(' ').filter(c => c.length > 0);
        if(!!words && words.length > 0) {
            if(words[0].indexOf('!') === 0) {
                const command = words[0];
                switch (command) {
                    case '!join':
                        const personIdx = this.queue.findIndex(p => p === chat.username);
                        if(personIdx < 0) {
                            this.queue.push(chat.username);
                            this.sendChannelMessage(`Added ${chat.username} to the queue`);
                        }
                        break;
                    case '!printq':
                        if(this.queue.length === 0) {
                            this.sendChannelMessage(`The queue is empty!`);
                            
                        } else {
                            let ppl = '';
                            for(let i = 0; i < this.queue.length; i++) {
                                ppl += `${i + 1} - ${this.queue[i]} \n`;
                            }
                            this.sendChannelMessage(`${ppl}`);
                        }
                        break;
                    case '!leave':
                        let idx = this.queue.findIndex(p => p === chat.username);
                        if(idx >= 0) {
                            this.queue.splice(idx, 1);
                            this.sendChannelMessage(`Removed ${chat.username} from the queue`);
                        }
                        break;
                    case '!next':
                        if (this.queue.length > 0 && chat.isMod) {
                            if(!this.lastQueuePopTime) {
                                this.lastQueuePopTime = new Date();
                                
                                // Pop the queue
                                let person = this.queue[0];
                                this.queue.splice(0, 1);
                                this.sendChannelMessage(`${person} is up next!`);
                                
                                if(this.queue.length === 0) {
                                    this.lastQueuePopTime = undefined;
                                }

                            } else {
                                const currentTime = new Date();

                                const mins = Math.abs(currentTime.getTime() - this.lastQueuePopTime.getTime()) / 1000 / 60;

                                if(mins > 0.25) {
                                    let person = this.queue[0];
                                    this.queue.splice(0, 1);
                                    this.sendChannelMessage(`${person} is up next!`);
                                    
                                    if(this.queue.length === 0) {
                                        this.lastQueuePopTime = undefined;
                                    }
                                }
                            }
                        }
                        break;
                    case '!remove':
                        if(chat.isMod && words[1].length > 0) {
                            const userIdx = this.queue.findIndex(q => q.toLocaleLowerCase() === words[1].toLocaleLowerCase());
                            if(userIdx >= 0) {
                                this.queue.splice(userIdx, 1);
                                this.sendChannelMessage(`${words[1]} has been removed from the queue!`);
                            }
                        } 
                        break;
                    case '!add':
                        if(chat.isMod && words[1].length > 0) {
                            if(words[2]) {
                                // add user to specific position in queue
                                // !add domfx 1
                                let queueIdx = +words[2];
                                if(!isNaN(queueIdx)) {
                                    this.queue.splice(queueIdx, 0, words[1]);                                
                                }
                            } else {
                                // add user to front of queue
                                this.queue.push(words[1]);
                            }
                        }
                        break;
                    case '!clearq':
                        if(chat.isMod) {
                            this.queue = [];
                        }
                        break;
                    case '!position':
                        const posIdx = this.queue.findIndex(i => i === chat.username);
                        if(posIdx >= 0) {
                            this.sendChannelMessage(`${chat.username} is position ${posIdx + 1} in the queue`);
                        } else {
                            this.sendChannelMessage(`${chat.username} is not in the queue`);
                        }
                        break;
                    default:
                        console.log('Invalid Command', command);
                        break;
                }
            }
        }
    }

    private sendChannelMessage(msg: string): void {
        this.w.send(`PRIVMSG #${this.channel} : ${msg}`);
    }

    private parseMessage(msg: string): Chat {
        const tokens = msg.split(':').filter(m => m.length > 0);

        if(tokens.length > 0) {            
            const badges = tokens[0].trim();
            const userTags = tokens[0].split(';');

            let isMod = false;
            const userTypeIdx = userTags.findIndex(m => m.startsWith('user-type'));
            if(userTypeIdx >= 0) {
                const userTypeTokens = userTags[userTypeIdx].split('=');
                if(userTypeTokens.length === 2 && userTypeTokens[1].trim() === 'mod') {
                    isMod = true;
                }
            }

            let isBroadcaster = false;
            const badgeListIdx = userTags.findIndex(m => m.startsWith('badges'));
            if(badgeListIdx >= 0) {
                const badgeTokens = userTags[badgeListIdx].split('=');
                if(badgeTokens.length === 2) {
                    isMod = true;
                    isBroadcaster = true;
                }

            }

            let username = ''
            const userNameIdx = userTags.findIndex(m => m.startsWith('display-name'));
            if(userNameIdx >= 0) {
                const userNameTokens = userTags[userNameIdx].split('=');
                if(userNameTokens.length === 2) {
                    username = userNameTokens[1];
                }
            }

            const parts = tokens[1].split(' ').filter(m => m.length > 0);
            const msgType = parts[2];      
            const channel = parts[2].slice(1, parts[2].length);

            const chatMessage = (!!tokens[2]) ? tokens[2] : '';
            
            console.log('User: ' + username + ' IsMod: ' + isMod + ' Message: ' + chatMessage);
            return new Chat(username, isMod, isBroadcaster, msgType, channel, chatMessage);
        }
    }
}

export interface WS extends WebSocket {
    on(event: string, handler: (msg: string) => any): any;
}