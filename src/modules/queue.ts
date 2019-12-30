import { TwitchModule } from "../twitch-module";

export class Queue extends TwitchModule {
    private _queue: string[];
    private _lastQueuePopTime: Date;
    private _queuePopCooldown: number = 0.15;
    private _isSubOnlyMode = false;
      
    constructor() {
        super();
        
        this._queue = [];

        this._commandMap.set('!join', this.joinQueue);
        this._commandMap.set('!printq', this.printQueue);
        this._commandMap.set('!leave', this.leaveQueue);
        this._commandMap.set('!next', this.showNextInQueue);
        this._commandMap.set('!add', this.addToQueue);
        this._commandMap.set('!position', this.showPosition);
        this._commandMap.set('!clearq', this.clearQueue);
        this._commandMap.set('!setq', this.setQueue);
        this._commandMap.set('!remove', this.removeFromQueue);
        this._commandMap.set('!subonly', this.setQueueSubOnly);
        this._commandMap.set('!allowall', this.setQueueToAll);
    } 
    
    commandHandler(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        return this._commandMap.get(cmd).call(this, username, isUserMod, isUserSub, cmd, args);
    }

    private printQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(this._queue.length === 0) {
            return `The queue is empty!`;
        } else {
            let ppl = '';
            for(let i = 0; i < this._queue.length; i++) {
                ppl += `${i + 1} - ${this._queue[i]} \n`;
            }
            console.log(JSON.stringify(this._queue));
            return `${ppl}`;
        }
    }

    private showNextInQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if (this._queue.length > 0 && isUserMod) {
            let mins = -1;
            if(!this._lastQueuePopTime) {
                this._lastQueuePopTime = new Date();
            } else {
                const currentTime = new Date();
                mins = Math.abs(currentTime.getTime() - this._lastQueuePopTime.getTime()) / 1000 / 60;
            }

            if(mins >= 0 && mins < this._queuePopCooldown) {
                return '';
            } else {
                let person = this._queue[0];
                this._queue.splice(0, 1);

                if(!this._queue || this._queue.length === 0)
                    this._lastQueuePopTime = undefined;
                else
                    this._lastQueuePopTime = new Date();
                
                return `${person} is up next!`;
            }
        } else  {
            if(this._queue.length > 0)
                return this.showPosition(username, isUserMod, isUserSub, cmd, args);
            else
                return 'The queue is empty!';
        }
    }

    private removeFromQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            let user = args[0];
            if(user.startsWith('@'))
                user = user.substring(1);

            const userIdx = this._queue.findIndex(q => q.toLocaleLowerCase() === user.toLocaleLowerCase());
            
            if(userIdx >= 0) {
                this._queue.splice(userIdx, 1);
                return `${user} has been removed from the queue!`;
            } else {
                return `Unable to find ${user} in the queue`;
            }
        } 
    }

    private addToQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            if(args[1]) {
                // add user to specific position in queue
                // !add domfx 1
                let user = args[0];
                if(user.startsWith('@'))
                    user = user.substring(1);

                let queueIdx = +args[1];
                if(!isNaN(queueIdx)) {
                    if(queueIdx >= 1) {
                        this._queue.splice(queueIdx - 1, 0, user);                                
                    }
                }
            } else {
                let user = args[0];
                if(user.startsWith('@'))
                    user = user.substring(1);

                // add user to back of queue
                this._queue.push(user);
            }
        }

        return '';
    }

    private joinQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(!this._isSubOnlyMode || (this._isSubOnlyMode && isUserSub)) {
            const personIdx = this._queue.findIndex(p => p === username);
            if(personIdx < 0) {
                this._queue.push(username);
                return `Added ${username} to the queue`;
            }
        } else {
            return `The queue is in sub only mode`;
        }
    }

    private leaveQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        let idx = this._queue.findIndex(p => p === username);
        if(idx >= 0) {
            this._queue.splice(idx, 1);
            return `Removed ${username} from the queue`;
        }
    }

    private clearQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(isUserMod) {
            this._queue = [];
        }

        return '';
    }

    private showPosition(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        const posIdx = this._queue.findIndex(i => i === username);
        if(posIdx >= 0) {
            return `${username} is position ${posIdx + 1} in the queue`;
        } else {
            return `${username} is not in the queue`;
        }
    }

    private setQueue(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            this._queue = JSON.parse(args[0]);
            return '';
        }
    }

    private setQueueSubOnly(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string { 
        if(isUserMod) {
            this._isSubOnlyMode = true;
            return 'The queue is in sub only mode';
        }
    }

    private setQueueToAll(username: string, isUserMod: boolean, isUserSub: boolean, cmd: string, args: string[]): string { 
        if(isUserMod) {
            this._isSubOnlyMode = false;
            return 'The queue is open to all';
        }
    }
}