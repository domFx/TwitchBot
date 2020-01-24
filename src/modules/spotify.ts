import * as request from 'request'; // "Request" library

import { Global } from '../models/global';

import { TwitchModule } from '../twitch-module';

export class Spotify extends TwitchModule {
    // your application requests authorization
    private _authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer(Global.instance().settings.spotify.clientId + ':' + Global.instance().settings.spotify.clientSecret).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    private _bearerToken: string = '';

    constructor() { 
        super();

        if (this._bearerToken.length === 0) {
            request.post(this._authOptions, function(error, response, body) {
                if (!error && response.statusCode === 200) {       
                    // use the access token to access the Spotify Web API
                    this._bearerToken = body.access_token;
                    console.log('Spotify Token', this._bearerToken)
                } else {
                    console.log('Error connecting to Spotify', error)
                }
              });
        }

        this._commandMap.set('!search', this.searchSongs);
    }

    commandHandler(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        return this._commandMap.get(cmd).call(this, username, isUserMod, isUserSub, cmd, args);
    }

    private searchSongs(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(args.length > 0) {
            var options = {
              url: `https://api.spotify.com/v1/search?${encodeURI(args.join())}&type=track`,
              headers: {
                'Authorization': 'Bearer ' + this._bearerToken
              },
              json: true
            };
            request.get(options, function(error, response, body) {
              console.log(body);
            });
        }

        return '';
    }
}