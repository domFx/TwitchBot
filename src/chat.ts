export class Chat {
    username: string;
    messageType: string;
    channelName: string;
    chatMessage: string;

    constructor(username: string, messageType: string, channelName: string, chatMessage: string) {
        this.username = username;
        this.messageType = messageType;
        this.channelName = channelName;
        this.chatMessage = chatMessage.trim();
    }
}