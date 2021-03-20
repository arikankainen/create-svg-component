import { Settings } from './types';

const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);

export const logError = (error: any) => {
    console.error('ERROR:', error);
};

export const createDirectory = (dir: string) => {
    try {
        if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (error: any) {
        logError(error);
    }
};

export const createDirectories = (dirs: string[]) => {
    dirs.forEach((dir) => createDirectory(dir));
};

export const parseArgs = (args: string[]): Settings => {
    let inputFolder = '';
    let outputFolder = '';
    let moveFolder = '';

    for (let i = 0; i < args.length; i++) {
        if (args[i] == '--in') {
            inputFolder = args[i + 1];
            i++;
        }

        if (args[i] == '--out') {
            outputFolder = args[i + 1];
            i++;
        }

        if (args[i] == '--move') {
            moveFolder = args[i + 1];
            i++;
        }
    }

    return { inputFolder, outputFolder, moveFolder };
};

export const getFiles = async (dir: string) => {
    try {
        return (await readdir(dir)) as string[];
    } catch (error: any) {
        logError(error);
        return [];
    }
};

export const readFile = async (file: string) => {
    try {
        if (fs.existsSync(file)) {
            return fs.readFileSync(file, 'utf8');
        }
    } catch (error) {
        logError(error);
        return '';
    }
};

export const getFilenameWithoutExtension = (file: string) => {
    return path.basename(file).split('.').slice(0, -1).join('.');
};

export const getComponentName = (name: string) => {
    const camelCased = name.toLowerCase().replace(/(-+|\s+)([a-z])/gi, (n) => {
        return n[1].toUpperCase();
    });

    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
};
