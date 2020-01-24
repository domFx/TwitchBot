import express from 'express';
import { createServer, Server } from 'http';
// import * as ws from 'ws';
// import * as fs from 'fs';
const ws = require('ws');
const fs = require('fs');

// Classes
import { Global } from './models/global';
import { UserMessage } from './models/user-message';
import { WS } from './models/ws';

// Modules
import { TwitchModule } from './twitch-module';

import { Queue } from './modules/queue';
import { Spotify } from './modules/spotify';

export class TwitchBot {
    w: WS;
    app: express.Application;
    server: Server;

    pingInterval: NodeJS.Timer;
    reconnectionCounter: number = 0;

    channels: Map<string, TwitchModule[]> = new Map<string, TwitchModule[]>();

    constructor() {
        try {
            Global.instance().settings = JSON.parse(fs.readFileSync('appsettings.json'));
                    
            if(Global.instance().settings) {
                if(Global.instance().settings.channels && Global.instance().settings.channels.length > 0) {
                    for(let c of Global.instance().settings.channels) {
                        if(c.active) {
                            this.channels.set(c.name, [
                                new Queue(),
                                new Spotify()
                            ]);
                        }
                    }

                    // Need at least one active channel to connect
                    this.connect();
                }    
            }      
        } catch (e) { 
            console.error('Failed to load settings file', e);
        } 
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

        console.log('Connecting');

        this.w.on('open', () => this.onOpen());
        this.w.on('close', () => this.onClose());
        this.w.on('message', (msg) => this.onMessage(msg));
    }

    private onOpen(): any {
        if(this.w.readyState === this.w.OPEN) {
            this.w.send(`CAP REQ :twitch.tv/tags`);

            console.log('Connected');
            this.w.send(`PASS ${Global.instance().settings.password}`);
            this.w.send(`NICK ${Global.instance().settings.username}`);

            for (const [channel, modules] of this.channels.entries()) {
                this.w.send(`JOIN #${channel}`);
            }

            this.pingInterval = setInterval(() => {
                if(!!this.w) {
                    this.w.send(`PING :tmi.twitch.tv`);
                }
            }, 60 * 1000);
        }
    }

    private onMessage(msg: string): any {   
        // Keep alive
        if(msg === 'PING :tmi.twitch.tv') {
            this.w.send('PONG :tmi.twitch.tv');
        } else if(msg === ':tmi.twitch.tv PONG tmi.twitch.tv :tmi.twitch.tv\r\n') { 
            //console.log('received pong')
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
        clearInterval(this.pingInterval);

        // Try to reconnect (5 tries max)
        if (Global.instance().settings.reconnectOnFail && this.reconnectionCounter <= 5) {
            this.reconnectionCounter++;
            this.connect();
        } else {
            console.error(`Unable to reconnect or exceeded the number of max retries (${this.reconnectionCounter} / 5)`);
        }
    }
    
    commandHandler(userMessage: UserMessage) {
        const words = userMessage.chatMessage.split(' ').filter(c => c.length > 0);
        if(!!words && words.length > 0) {
            if(words[0].indexOf('!') === 0) {
                const cmd = words[0].toLocaleLowerCase();

                words.shift();
                const args = words;

                if(userMessage.isOverlord && cmd === '!domcmds') { 
                    let cmds = [];
                    for(let module of this.channels.get(userMessage.channelName)) {
                        cmds.push(module.getCommands());
                        let msg = cmds.join('\n');
                        this.sendChannelMessage(userMessage.channelName, msg);
                    }
                } else if (userMessage.isOverlord && cmd === '!channels') {
                    const channels = [];
        
                    for(let [key, val] of this.channels.entries()) {
                        channels.push(key);
                    }
                    let msg = channels.join(', ');
                    this.sendChannelMessage(userMessage.channelName, msg);
                } else {
                    for(let modules of this.channels.get(userMessage.channelName)) {
                        const returnMsg = modules.commandHandler(userMessage.username, userMessage.isMod, userMessage.isSubscriber, cmd, args);
                        if(!!returnMsg && returnMsg.length > 0)
                            this.sendChannelMessage(userMessage.channelName, returnMsg);
                    }
                }

            }
        }
    }

    private sendChannelMessage(channel: string, msg: string): void {
        this.w.send(`PRIVMSG #${channel} : ${msg}`);
    }

    private sendWhisper(username: string, msg: string): void {
        this.w.send(`PRIVMSG #jtv :/w ${username} ${msg}`);
    }

    private parseMessage(msg: string): UserMessage {
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
            
            const isOverlord = Global.instance().settings.overlords.indexOf(username) >= 0;

            return new UserMessage(username, isMod, isBroadcaster, isSubscriber, isOverlord, msgType, channel, chatMessage);
        }
    }
}