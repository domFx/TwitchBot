import { Channel } from "./channel";

export interface AppSettings {
    username: string;
    password: string;
    overlords: string[];
    reconnectOnFail: boolean;
    channels: Channel[];
}