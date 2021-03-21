export interface Settings {
    inputFolder: string;
    outputFolder: string;
    moveFolder: string;
    suffix: string;
    tabSize: number;
    template: string;
    overwrite: boolean;
}

export interface CreateComponent {
    svg: string;
    name: string;
    template: string;
}
