import WorkSpaces from ".";


export type IWorkspaces = {
    id: number;
    name: string;
    gitUrl: string;
    state: string;
    podObject: string;
    password: string;
};
