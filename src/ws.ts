export interface WS extends WebSocket {
    on(event: string, handler: (msg: string) => any): any;
}