import express from 'express';
import { createServer, Server } from 'http';
const ws = require('ws');
const fs = require('fs');

import { Chat } from './chat';
import { Quiz } from './quiz';

export class TwitchBot {
    w: WS;
    app: express.Application;
    server: Server;

    username: string = '';
    password: string = '';

    channel: string = 'pyrolok';

    quiz: Quiz;
    
    constructor() {
        const config: any = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        this.username = config.username;
        this.password = config.password;

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
            this.w.send(`PASS ${this.password}`);
            this.w.send(`NICK ${this.username}`);
            this.w.send(`JOIN #${this.channel}`);
            //this.w.send(`PRIVMSG #${this.channel} Connected`);

            this.quiz = new Quiz();
        }
    }

    private onMessage(msg: string): any {   
        // Keep alive
        if(msg === 'PING :tmi.twitch.tv') {
            this.w.send('PONG :tmi.twitch.tv');
        } else {
            //console.log(msg);

            if(msg.indexOf('PRIVMSG') >= 0) {
                try {
                    let r = this.parseMessage(msg);
                    console.log(`@${r.username}: ${r.chatMessage}`);
                    this.commandHandler(r);
                    // if(r.username === 'pyrolok' && r.chatMessage === 'test')
                    //     this.w.send(`PRIVMSG #${this.channel} : bot test`);
                } catch {
                    console.log('Unable to parse message', msg);
                }
            }
        }
    }

    private onClose(): any {
        console.log('Connection Closed');
    }
    
    commandHandler(chat: Chat) {
        const words = chat.chatMessage.split(' ').filter(c => c.length > 0);
        if(!!words && words.length > 0) {
            if(words[0].indexOf('!') === 0) {
                const command = words[0];
                switch (command) {
                    case '!addwinner':
                    case '!aw': 
                        this.quiz.addWinner(words[1]);
                        break;
                    case '!printwinners':
                    case '!pw':
                        console.log(command);
                        this.w.send(`PRIVMSG #${this.channel} : ${this.quiz.printWinners()}`);
                        break;
                    default:
                        console.log('Invalid Command', command);
                }
            }
        }
    }







    private parseMessage(msg: string): Chat {
        const tokens = msg.split(':').filter(m => m.length > 0);

        if(tokens.length === 2) { 
            const parts = tokens[0].split(' ').filter(m => m.length > 0);

            const username = parts[0].split('!')[0];
            const msgType = parts[1];      
            const channel = parts[2].slice(1, parts[2].length);         
            const chatMessage = (!!tokens[1]) ? tokens[1] : '';

            return new Chat(username, msgType, channel, chatMessage);
        }
    }
}

export interface WS extends WebSocket {
    on(event: string, handler: (msg: string) => any): any;
}