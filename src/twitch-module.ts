export class TwitchModule { 
    protected _commandMap = new Map<string, any>();   

    commandHandler(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        return '';
    }

    getCommands(): string[] {
        const cmds = [];
        
        for(let [key, val] of this._commandMap.entries()) {
            cmds.push(key);
        }

        return cmds;
    }
}