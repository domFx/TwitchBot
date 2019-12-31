export class UserMessage {
    username: string;
    isMod: boolean;
    isBroadcaster: boolean;
    isSubscriber: boolean;
    isOverlord: boolean;
    messageType: string;
    channelName: string;
    chatMessage: string;

    constructor(username: string, isMod: boolean, isBroadcaster: boolean, isSubscriber: boolean, isOverlord: boolean, messageType: string, channelName: string, chatMessage: string) {
        this.username = username;
        this.isMod = isMod;
        this.isBroadcaster = isBroadcaster;
        this.isSubscriber = isSubscriber;
        this.isOverlord = isOverlord;
        this.messageType = messageType;
        this.channelName = channelName;
        this.chatMessage = chatMessage.trim();
    }
}