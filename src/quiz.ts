export class Quiz { 
    winners: Winner[];

    constructor() {
        this.winners = [];
    }

    addWinner(name: string) {
        console.log('adding winner ' + name);
        const wIdx = this.winners.findIndex((w: Winner) => w.name === name);

        if(wIdx < 0) {
            this.winners.push(new Winner(name));
        } else {
            this.winners[wIdx].winCount++;
        }

        this.sortWinners();
    }

    printWinners(): string {
        let winners = '';

        this.winners.forEach(w => winners += ` ${w.name}(${w.winCount})`);

        winners = `QUIZ LEADERBOARD: ${winners.substr(1)}`;
        console.log(winners);
        return winners;
    }

    private sortWinners() {
        this.winners.sort((a: Winner, b: Winner) => {
            if (a.winCount > b.winCount)
                return -1;
            else if(b.winCount > a.winCount)
                return 1;
            else
                return 0;
        });
    }
}


class Winner {
    name: string;
    winCount: number;

    constructor(name: string) {
        this.name = name;
        this.winCount = 1;
    }
}