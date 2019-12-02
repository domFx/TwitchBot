export class Queue {
    private _queue: string[];

    constructor() {
        this._queue = [];
    }

    commandHandler(username: string, isUserMod: boolean, cmd: string, args: string[]): string {
        let returnMsg = '';
        
        switch(cmd) {
            case '!join':
                returnMsg = this.joinQueue(username);
                break;
            case '!printq':
                returnMsg = this.printQueue();
                break;
            case '!leave':
                returnMsg = this.leaveQueue(username);
                break;
            case '!next':
                returnMsg = this.showNextInQueue(username, isUserMod);
                break;
            case '!add':
                returnMsg = this.addToQueue(isUserMod, args);
                break;
            case '!position':
                returnMsg = this.showPosition(username);
                break;
            case '!clearq':
                returnMsg = this.clearQueue(isUserMod);
                break;
            case '!setq':
                returnMsg = this.setQueue(isUserMod, args);
                break;
            case '!remove':
                returnMsg = this.removeFromQueue(isUserMod, args);
                break;
            default: 
                break;   
        }

        return returnMsg;
    }

    private printQueue(): string {
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

    private showNextInQueue(username: string, isUserMod: boolean): string {
        if (this._queue.length > 0 && isUserMod) {
            // if(!this.lastQueuePopTime) {
            //     this.lastQueuePopTime = new Date();
                
            //     // Pop the queue
            //     let person = this._queue[0];
            //     this._queue.splice(0, 1);
            //     return `${person} is up next!`;
                
            //     // if(this._queue.length === 0) {
            //     //     this.lastQueuePopTime = undefined;
            //     // }

            // } else {

            // }

            // const currentTime = new Date();
            // const mins = Math.abs(currentTime.getTime() - this.lastQueuePopTime.getTime()) / 1000 / 60;
            // if(mins > 0.25) {
            // }

            // if(this._queue.length === 0) {
            //     this.lastQueuePopTime = undefined;
            // }
            let person = this._queue[0];
            this._queue.splice(0, 1);
            return `${person} is up next!`;
        } else  {
            if(this._queue.length > 0)
                return this.showPosition(username);
            else
                return 'The queue is empty!'
        }
    }

    private removeFromQueue(isUserMod: boolean, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            const userIdx = this._queue.findIndex(q => q.toLocaleLowerCase() === args[0].toLocaleLowerCase());
            if(userIdx >= 0) {
                this._queue.splice(userIdx, 1);
                return `${args[0]} has been removed from the queue!`;
            } else {
                return `Unable to find ${args[0]} in the queue`;
            }
        } 
    }

    private addToQueue(isUserMod: boolean, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            if(args[1]) {
                // add user to specific position in queue
                // !add domfx 1
                let queueIdx = +args[1];
                if(!isNaN(queueIdx)) {
                    if(queueIdx >= 1) {
                        this._queue.splice(queueIdx - 1, 0, args[0]);                                
                    }
                }
            } else {
                // add user to back of queue
                this._queue.push(args[0]);
            }
        }

        return '';
    }

    private joinQueue(username: string): string {
        const personIdx = this._queue.findIndex(p => p === username);
        if(personIdx < 0) {
            this._queue.push(username);
            return `Added ${username} to the queue`;
        }
    }

    private leaveQueue(username: string): string {
        let idx = this._queue.findIndex(p => p === username);
        if(idx >= 0) {
            this._queue.splice(idx, 1);
            return `Removed ${username} from the queue`;
        }
    }

    private clearQueue(isUserMod: boolean): string {
        if(isUserMod) {
            this._queue = [];
        }

        return '';
    }

    private showPosition(username: string): string {
        const posIdx = this._queue.findIndex(i => i === username);
        if(posIdx >= 0) {
            return `${username} is position ${posIdx + 1} in the queue`;
        } else {
            return `${username} is not in the queue`;
        }
    }

    private setQueue(isUserMod: boolean, args: string[]): string {
        if(isUserMod && args[0].length > 0) {
            this._queue = JSON.parse(args[0]);
            return '';
        }
    }
}