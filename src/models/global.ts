import { Settings } from "./settings";

export class Global {
    private static _instance: Global;

    public settings: Settings;

    public static instance(): Global { 
        if (!Global._instance) {
            Global._instance = new Global();
        }

        return Global._instance;
    }
}