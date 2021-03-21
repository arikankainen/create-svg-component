const fs = require('fs');
const path = require('path');
const util = require('util');
const pipeline = util.promisify(require('stream').pipeline);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

import { CreateComponent, Settings } from './types';

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
    let suffix = '';
    let tabSize = 0;
    let template = '';
    let overwrite = false;

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

        if (args[i] == '--suffix') {
            suffix = args[i + 1];
            i++;
        }

        if (args[i] == '--tabSize') {
            tabSize = +args[i + 1];
            i++;
        }

        if (args[i] == '--template') {
            template = args[i + 1];
            i++;
        }

        if (args[i] == '--overwrite') {
            overwrite = true;
        }
    }

    return { inputFolder, outputFolder, moveFolder, suffix, tabSize, template, overwrite };
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

export const writeFile = async (file: string, content: string, overwrite: boolean) => {
    try {
        if (overwrite || !fs.existsSync(file)) {
            fs.writeFileSync(file, content);
            console.log('Created:', file);
            return true;
        } else {
            logError(`File '${file}' already exist.`);
            return false;
        }
    } catch (error) {
        logError(error);
        return false;
    }
};

export const moveFile = async (source: string, destination: string, overwrite: boolean) => {
    try {
        if (overwrite || !fs.existsSync(destination)) {
            await pipeline(fs.createReadStream(source), fs.createWriteStream(destination));
            await unlink(source);
            return true;
        } else {
            logError(`Can't move converted file, file '${destination}' already exist.`);
            return false;
        }
    } catch (error) {
        logError(error);
        return false;
    }
};

export const getFilenameWithoutExtension = (file: string) => {
    return path.basename(file).split('.').slice(0, -1).join('.');
};

export const getComponentName = (name: string) => {
    const specialCharsRemoved = name.replace(/[^a-zA-Z0-9\s-_]/gi, '').toLowerCase();
    const camelCased = specialCharsRemoved.replace(/(-+|_+|\s+)([a-z])/gi, (n) => {
        return n[1].toUpperCase();
    });

    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
};

export const getSvgTag = (input: string) => {
    const match = input.match(/<svg.*?<\/svg>/gis);

    if (!match) {
        logError('SVG tag not found.');
        return '';
    }

    const svg = match[0]
        .replace(/<title.*?<\/title>/gis, '')
        .replace(/\s\s+/g, ' ')
        .replace(/<g>\s*<\/g>/gi, '')
        .replace(/>\s+</g, '><');

    return svg;
};

export const removeSvgProperties = (input: string) => {
    const properties = ['version', 'id', 'xmlns', 'xmlns:xlink', 'xml:space', 'style'];

    let svg = input;
    properties.forEach((property) => {
        const pattern = new RegExp('(<svg[^>]*) ' + property + '=".*?"(.*?>)', 'gis');
        svg = svg.replace(pattern, '$1$2');
    });

    return svg;
};

export const capitalizeTags = (input: string) => {
    const tags = input.split('>');

    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];

        if (tag.trim().length > 1) {
            if (tag.substring(1, 2) !== '/') {
                const capitalizedTag = tag.substring(0, 2).toUpperCase() + tag.substring(2);
                tags[i] = capitalizedTag;
            } else {
                const capitalizedTag = tag.substring(0, 3).toUpperCase() + tag.substring(3);
                tags[i] = capitalizedTag;
            }
        }
    }

    const capitalizedTags = tags.join('>\n');
    return capitalizedTags;
};

export const addProps = (input: string) => {
    const match = input.match(/(<svg.*?)(>.*)/is);

    if (!match) {
        logError('SVG tag not found.');
        return '';
    }

    return `${match[1]} \{...props\}${match[2]}`;
};

export const addTabs = (input: string, tabSize: number) => {
    const lines = input.split('\n');

    enum TagType {
        None,
        Single,
        Closing,
        Opening,
    }

    let lastTagType = TagType.Opening;
    let tab = tabSize;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const single = Boolean(line.match(/<.+\/>/));
        const closing = Boolean(line.match(/<\/.+>/));
        const opening = Boolean(line.match(/<.*>/));

        let tagType = TagType.None;
        if (single) tagType = TagType.Single;
        else if (closing) tagType = TagType.Closing;
        else if (opening) tagType = TagType.Opening;

        if (lastTagType === TagType.Opening) {
            if (tagType !== TagType.Closing) {
                tab += tabSize;
            }
        } else if (lastTagType === TagType.Single) {
            if (tagType === TagType.Closing) {
                tab -= tabSize;
            }
        } else if (lastTagType === TagType.Closing) {
            if (tagType === TagType.Closing) {
                tab -= tabSize;
            }
        }

        if (tab < 0) tab = 0;
        lines[i] = `${' '.repeat(tab)}${line}`;
        lastTagType = tagType;
    }

    return lines.join('\n');
};

export const createComponent = (svg: string, name: string, template: string) => {
    let tags: string[] = [];

    const regex = /<(\w+)[\s|>]/gis;
    let match = regex.exec(svg);

    while (match != null) {
        const tag = match[1];

        if (!tags.includes(tag) && tag !== 'Svg') {
            tags.push(tag);
        }

        match = regex.exec(svg);
    }

    const tagString = tags.join(', ');

    const component = template
        .replace(/[ \t]*?%svg%/gi, svg)
        .replace(/%name%/gi, name)
        .replace(/%tags%/gi, tagString);

    return component;
};
