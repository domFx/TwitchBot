import { HttpHelper } from '../helpers/http-helper';

import { Global } from '../models/global';

import { TwitchModule } from '../twitch-module';

export class Spotify extends TwitchModule {
    private _http: HttpHelper;

    private _bearerToken: string = '';

    constructor() { 
        super();

        this._http = new HttpHelper();
        
        console.log('getting bearer token', `${Global.instance().settings.spotify.clientId}:${Global.instance().settings.spotify.clientSecret}`);
        if (this._bearerToken.length === 0) {
            this._http.submitRequest(
                'POST', 
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                [{ key: 'Authorization', value: `Basic ${Global.instance().settings.spotify.clientId}:${Global.instance().settings.spotify.clientSecret}`}]
            ).then((response: any) => console.log('Response', response)).catch((error: any) => console.error('Error', error));
        }
        
    }
}