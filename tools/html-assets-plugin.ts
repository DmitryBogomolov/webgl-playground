import type { WebpackPluginInstance, Compiler, Compilation } from 'webpack';
import type { Playground, Template } from './playground.types';
import { sources } from 'webpack';
import { promisify } from 'node:util';
import path from 'node:path';
import Mustache from 'mustache';

export const TEMPLATES_DIR = path.join(__dirname, '../templates');
export const STATIC_DIR = path.join(__dirname, '../static');
export const PLAYGROUND_DIR = path.join(__dirname, '../playground');

export const ROOT_TEMPLATE_NAME = 'index';
export const PLAYGROUND_TEMPLATE_NAME = 'playground';

const PLAYGROUND_PATH = 'playground';
export const STATIC_PATH = 'static';

function renderRootPage(playgrounds: ReadonlyArray<Playground>, templates: ReadonlyMap<string, string>): string | null {
    const template = templates.get(ROOT_TEMPLATE_NAME);
    if (!template) {
        return null;
    }
    return Mustache.render(template, {
        title: 'WebGL Playground',
        bootstrap_styles_url: `./${STATIC_PATH}/bootstrap.min.css`,
        favicon_url: `./${STATIC_PATH}/favicon.png`,
        styles_url: `./${ROOT_TEMPLATE_NAME}.css`,
        bundle_url: `./${ROOT_TEMPLATE_NAME}.js`,
        playgrounds: playgrounds.map(
            ({ name, title }) => ({ url: `./${PLAYGROUND_PATH}/${name}.html`, title }),
        ),
    });
}

function renderPlaygroundPage(playground: Playground, templates: ReadonlyMap<string, string>): string | null {
    const template = templates.get(PLAYGROUND_TEMPLATE_NAME);
    if (!template) {
        return null;
    }
    const { name } = playground;
    return Mustache.render(template, {
        name,
        title: playground.title,
        bootstrap_styles_url: `../${STATIC_PATH}/bootstrap.min.css`,
        styles_url: `../${STATIC_PATH}/playground.css`,
        back_url: '../',
        bundle_url: `./${name}.js`,
        worker_url: playground.worker ? `./${name}_worker.js` : null,
        custom_markup: playground.markup ? templates.get(name)! : null,
    });
}

function collectTemplates(playgrounds: Iterable<Playground>): Map<string, Template> {
    const list: Template[] = [
        { name: ROOT_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, `${ROOT_TEMPLATE_NAME}.html`) },
        { name: PLAYGROUND_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, `${PLAYGROUND_TEMPLATE_NAME}.html`) },
    ];
    for (const playground of playgrounds) {
        if (playground.markup) {
            list.push({ name: playground.name, path: playground.markup });
        }
    }
    return new Map(list.map((template) => ([template.path, template])));
}

const NAME = 'html-assets-plugin';

export function htmlAssetsPlugin(playgrounds: ReadonlyArray<Playground>): WebpackPluginInstance {
    return {
        apply: (compiler) => {
            const templateIndex = collectTemplates(playgrounds);
            const templateContents = new Map<string, string>();
            const assetSources = new Map<string, sources.RawSource>();
            compiler.hooks.compilation.tap(NAME, (compilation) => {
                for (const template of templateIndex.values()) {
                    compilation.fileDependencies.add(template.path);
                }
                const changedTemplates = findChangedTemplates(compiler, templateIndex, templateContents);
                if (changedTemplates.length === 0) {
                    emitAssets(compilation, assetSources);
                    return;
                }
                const changedAssets = findAffectedAssets(playgrounds, changedTemplates);
                updateTemplates(compiler, changedTemplates, templateContents)
                    .then(() => {
                        updateAssets(changedAssets, playgrounds, templateContents, assetSources);
                    })
                    .catch((err) => {
                        compilation.errors.push(err as Error);
                    })
                    .finally(() => {
                        emitAssets(compilation, assetSources);
                    });
            });
        },
    };
}

function findChangedTemplates(
    compiler: Compiler,
    templateIndex: ReadonlyMap<string, Template>,
    templateContents: ReadonlyMap<string, string>,
): Template[] {
    if (templateContents.size === 0) {
        return Array.from(templateIndex.values());
    }
    if (compiler.modifiedFiles) {
        const list: Template[] = [];
        for (const filePath of compiler.modifiedFiles) {
            const template = templateIndex.get(filePath);
            if (template) {
                list.push(template);
            }
        }
        return list;
    }
    return [];
}

function findAffectedAssets(playgrounds: Iterable<Playground>, changedTemplates: Iterable<Template>): string[] {
    const collection = new Set<string>();
    for (const template of changedTemplates) {
        if (template.name === ROOT_TEMPLATE_NAME) {
            collection.add(ROOT_TEMPLATE_NAME);
        } else if (template.name === PLAYGROUND_TEMPLATE_NAME) {
            for (const playground of playgrounds) {
                collection.add(playground.name);
            }
        } else {
            collection.add(template.name);
        }
    }
    return Array.from(collection);
}

function updateTemplates(
    compiler: Compiler,
    changedTemplates: ReadonlyArray<Template>,
    templateContents: Map<string, string>,
): Promise<void> {
    if (!compiler.inputFileSystem) {
        return Promise.reject(new Error('compiler.inputFileSystem is null'));
    }
    const readFile = promisify(compiler.inputFileSystem.readFile);
    return Promise.allSettled(
        changedTemplates.map((template) => readFile(template.path)),
    ).then((settledList) => {
        const errors: string[] = [];
        for (let i = 0; i < settledList.length; ++i) {
            const settled = settledList[i];
            if (settled.status === 'fulfilled') {
                const content = Buffer.from(settled.value!).toString('utf8');
                templateContents.set(changedTemplates[i].name, content);
            } else {
                errors.push((settled.reason as Error).message);
            }
        }
        if (errors.length > 0) {
            throw new Error(`failed to read files: ${errors.join('; ')}`);
        }
    });
}

function updateAssets(
    assets: ReadonlyArray<string>,
    playgrounds: ReadonlyArray<Playground>,
    templateContents: ReadonlyMap<string, string>,
    assetSources: Map<string, sources.RawSource>,
): void {
    const errors: string[] = [];
    for (const asset of assets) {
        let content: string | null;
        let filePath: string;
        if (asset === ROOT_TEMPLATE_NAME) {
            content = renderRootPage(playgrounds, templateContents);
            filePath = `${asset}.html`;
        } else {
            const playground = playgrounds.find((playground) => playground.name === asset)!;
            content = renderPlaygroundPage(playground, templateContents);
            filePath = `${PLAYGROUND_PATH}/${asset}.html`;
        }
        if (content) {
            const source = new sources.RawSource(content, false);
            assetSources.set(filePath, source);
        } else {
            errors.push(asset);
        }
    }
    if (errors.length > 0) {
        throw new Error(`no templates for assets: ${errors.join(', ')}`);
    }
}

function emitAssets(
    compilation: Compilation,
    assetSources: ReadonlyMap<string, sources.RawSource>,
): void {
    for (const [key, source] of assetSources) {
        compilation.emitAsset(key, source);
    }
}
