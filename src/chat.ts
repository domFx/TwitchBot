export class Chat {
    username: string;
    isMod: boolean;
    isBroadcaster: boolean;
    isSubscriber: boolean;
    messageType: string;
    channelName: string;
    chatMessage: string;

    constructor(username: string, isMod: boolean, isBroadcaster: boolean, isSubscriber: boolean, messageType: string, channelName: string, chatMessage: string) {
        this.username = username;
        this.isMod = isMod;
        this.isBroadcaster = isBroadcaster;
        this.isSubscriber = isSubscriber;
        this.messageType = messageType;
        this.channelName = channelName;
        this.chatMessage = chatMessage.trim();
    }
}