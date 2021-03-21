const path = require('path');

import { Settings } from './types';
import {
    createDirectories,
    parseArgs,
    getFiles,
    readFile,
    getComponentName,
    getFilenameWithoutExtension,
    getSvgTag,
    removeSvgProperties,
    capitalizeTags,
    addProps,
    createComponent,
    logError,
    writeFile,
    moveFile,
    addTabs,
} from './utils';

const main = async () => {
    const args = process.argv.slice(2);
    const settings = parseArgs(args);

    if (!settings.template) {
        logError('Template not specified.');
        return;
    }

    if (!settings.inputFolder) {
        logError('Input folder not specified.');
        return;
    }

    if (!settings.outputFolder) {
        logError('Output folder not specified.');
        return;
    }

    createDirectories([settings.inputFolder, settings.moveFolder, settings.outputFolder]);

    const inputFiles = await getFiles(settings.inputFolder);

    if (inputFiles.length === 0) {
        logError('Input folder does not contain any SVG files.');
        return;
    }

    console.log('Converting SVG files to react-native-svg components...');

    let count = 0;
    for (const file of inputFiles) {
        const success = await parseFile(settings, file);
        if (success) count++;
    }

    console.log(`${count.toString()} files converted.`);
};

main();

const parseFile = async (settings: Settings, inputFile: string) => {
    const basename = getFilenameWithoutExtension(inputFile);
    const componentName = `${getComponentName(basename)}${settings.suffix}`;
    const outputFile = `${componentName}.tsx`;

    const inputFileWithPath = path.join(settings.inputFolder, inputFile);
    const outputFileWithPath = path.join(settings.outputFolder, outputFile);
    const moveFileWithPath = path.join(settings.moveFolder, inputFile);

    const content = await readFile(inputFileWithPath);
    const template = await readFile(settings.template);

    let svg = getSvgTag(content);
    svg = removeSvgProperties(svg);
    svg = capitalizeTags(svg);
    svg = addProps(svg);
    svg = addTabs(svg, settings.tabSize);
    svg = createComponent(svg, componentName, template);

    const successfullyWrited = await writeFile(outputFileWithPath, svg, settings.overwrite);

    if (successfullyWrited && settings.moveFolder) {
        moveFile(inputFileWithPath, moveFileWithPath, settings.overwrite);
    }

    return successfullyWrited;
};
