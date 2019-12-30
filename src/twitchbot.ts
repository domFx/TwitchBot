import express from 'express';
import { createServer, Server } from 'http';
const ws = require('ws');
//const fs = require('fs');

import { Credentials } from './credentials';

// Classes
import { Chat } from './chat';
import { WS } from './ws';

// Modules
import { TwitchModule } from './twitch-module';
import { Queue } from './modules/queue';

export class TwitchBot {
    w: WS;
    app: express.Application;
    server: Server;

    username: string = '';
    password: string = '';

    channels: Map<string, TwitchModule[]> = new Map<string, TwitchModule[]>();

    reconnect: boolean = true;

    constructor() {
        this.username = Credentials.user; 
        this.password =  Credentials.password;

        this.channels.set('ooclanoo', [
            new Queue()
        ]);

        this.connect();
    }

    private connect() {
        // Clean up old connections
        this.app = null;
        this.server = null;
        this.w = null;

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

            for (const [channel, modules] of this.channels.entries()) {
                this.w.send(`JOIN #${channel}`);
            }
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

        if (this.reconnect) {
            // Try to reconnect
            this.connect();
        }
    }
    
    commandHandler(chat: Chat) {
        const words = chat.chatMessage.split(' ').filter(c => c.length > 0);
        if(!!words && words.length > 0) {
            if(words[0].indexOf('!') === 0) {
                const cmd = words[0].toLocaleLowerCase();

                words.shift();
                const args = words;

                if(cmd === '!domcmds') { 
                    let cmds = [];
                    for(let module of this.channels.get(chat.channelName)) {
                        cmds.push(module.getCommands());
                        let msg = cmds.join('\n');
                        this.sendChannelMessage(chat.channelName, msg);
                    }
                } else {
                    for(let modules of this.channels.get(chat.channelName)) {
                        const returnMsg = modules.commandHandler(chat.username, chat.isMod, chat.isSubscriber, cmd, args);
                        if(!!returnMsg && returnMsg.length > 0)
                            this.sendChannelMessage(chat.channelName, returnMsg);
                    }
                }

            }
        }
    }

    private sendChannelMessage(channel: string, msg: string): void {
        this.w.send(`PRIVMSG #${channel} : ${msg}`);
    }

    private parseMessage(msg: string): Chat {
        const tokens = msg.split(':').filter(m => m.length > 0);

        if(tokens.length > 0) {            
            const badges = tokens[0].trim();
            const userTags = tokens[0].split(';');

            let isMod = false;
            const modIdx = userTags.findIndex(m => m.startsWith('mod'));
            if(modIdx >= 0) {
                const userTypeTokens = userTags[modIdx].split('=');
                if(userTypeTokens.length === 2 && +userTypeTokens[1].trim() === 1) {
                    isMod = true;
                }
            }

            let isBroadcaster = false;
            let isSubscriber = false;
            const badgeListIdx = userTags.findIndex(m => m.startsWith('badges'));
            if(badgeListIdx >= 0) {
                const badgeTokens = userTags[badgeListIdx].split('=');
                if(badgeTokens.length === 2) {
                    if(badgeTokens[1].includes('broadcaster')) {
                        isMod = true;
                        isBroadcaster = true;
                    } else if(badgeTokens[1].includes('subscriber')) {
                        isSubscriber = true;
                    }                    
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
            
            console.log('Channel: ' + channel + ' User: ' + username + ' IsMod: ' + isMod + ' IsBroadcaster: ' + isBroadcaster + ' Sub: ' + isSubscriber + ' Message: ' + chatMessage);
            return new Chat(username, isMod, isBroadcaster, isSubscriber, msgType, channel, chatMessage);
        }
    }
}