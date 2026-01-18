import EasCommand from '../../commandUtils/EasCommand';
export default class DeviceView extends EasCommand {
    static description: string;
    static args: {
        name: string;
    }[];
    static contextDefinition: {
        loggedIn: import("../../commandUtils/context/LoggedInContextField").default;
        projectId: import("../../commandUtils/context/ProjectIdContextField").ProjectIdContextField;
    };
    runAsync(): Promise<void>;
}
