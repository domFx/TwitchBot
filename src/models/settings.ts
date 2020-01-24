import { ChannelSettings } from './channel-settings';
import { SpotifySettings } from './spotify-settings';

export interface Settings {
    username: string;
    password: string;
    overlords: string[];
    reconnectOnFail: boolean;
    spotify: SpotifySettings;
    channels: ChannelSettings[];
}