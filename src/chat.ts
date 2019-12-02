export class Chat {
    username: string;
    isMod: boolean;
    isBroadcaster: boolean;
    messageType: string;
    channelName: string;
    chatMessage: string;

    constructor(username: string, isMod: boolean, isBroadcaster: boolean, messageType: string, channelName: string, chatMessage: string) {
        this.username = username;
        this.isMod = isMod;
        this.isBroadcaster = this.isBroadcaster;
        this.messageType = messageType;
        this.channelName = channelName;
        this.chatMessage = chatMessage.trim();
    }
}