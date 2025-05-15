import {AppStateEnum} from "@/common/app/app.state.enum";

export class AppEnvironment {
    private static NODE_ENV = process.env.NODE_ENV;
    private static APP_PORT = Number(process.env.APP_PORT);
    private static YJS_PORT = Number(process.env.YJS_PORT);
    private static WS_PORT = Number(process.env.WS_PORT);
    private static WS_PORT_TEST = 4500;
    private static APP_PORT_TEST = 3500;

    static getWsPort() {
        if (AppEnvironment.NODE_ENV === AppStateEnum.Jest) {
            return AppEnvironment.WS_PORT_TEST;
        }
        return AppEnvironment.WS_PORT;
    }

    static getAppPort() {
        if (AppEnvironment.NODE_ENV === AppStateEnum.Jest) {
            return AppEnvironment.APP_PORT_TEST;
        }
        return AppEnvironment.APP_PORT;
    }

    static getYJSPort() {
        if (AppEnvironment.NODE_ENV === AppStateEnum.Jest) {
            return AppEnvironment.YJS_PORT;
        }
        return AppEnvironment.YJS_PORT;
    }

    static getNodeEnv() {
        return AppEnvironment.NODE_ENV;
    }
}
