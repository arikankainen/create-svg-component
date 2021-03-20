const path = require('path');

import { Settings } from './types';
import {
    createDirectories,
    parseArgs,
    getFiles,
    readFile,
    getComponentName,
    getFilenameWithoutExtension,
} from './utils';

const main = async () => {
    const args = process.argv.slice(2);
    const settings = parseArgs(args);

    createDirectories([settings.inputFolder, settings.moveFolder, settings.outputFolder]);

    const inputFiles = await getFiles(settings.inputFolder);

    for (const file of inputFiles) {
        await parseFile(settings, file);
    }
};

main();

const parseFile = async (settings: Settings, file: string) => {
    const basename = getFilenameWithoutExtension(file);
    const componentName = getComponentName(basename);
    const outputFile = `${componentName}.tsx`;
    const outputFileWithPath = path.join(settings.outputFolder, outputFile);
    const fileWithPath = path.join(settings.inputFolder, file);
    const content = await readFile(fileWithPath);

    console.log(content.substring(0, 10));
    console.log(outputFileWithPath);
};
