import type { WebpackPluginInstance, Compiler, Compilation } from 'webpack';
import type { RequestHandler } from 'webpack-dev-server';
import type { Playground, Template } from './playground.types';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import Mustache from 'mustache';

export const CONTENT_PATH = '/static';
export const ASSETS_PATH = '/assets';
const BOOTSTRAP_PATH = `${CONTENT_PATH}/bootstrap.min.css`;
const PLAYGROUND_PATH = '/playground';

export const TEMPLATES_DIR = path.join(__dirname, '../templates');
const PLAYGROUND_DIR = path.join(__dirname, '../playground');

const ROOT_TEMPLATE_NAME = 'index';
const PLAYGROUND_TEMPLATE_NAME = 'playground';

export interface DevServerHandler {
    readonly path: string;
    readonly handler: RequestHandler;
}

export function setupHandlers(playgrounds: ReadonlyArray<Playground>): DevServerHandler[] {
    const templates = new Map<string, string>();
    let rootPageCache = '';
    const playgroundPagesCache = new Map<string, string>();

    watchTemplates(playgrounds, templates, (name) => {
        if (name === ROOT_TEMPLATE_NAME) {
            rootPageCache = '';
        } else if (name === PLAYGROUND_TEMPLATE_NAME) {
            playgroundPagesCache.clear();
        } else {
            playgroundPagesCache.delete(name);
        }
    });

    function getRootPage(): string {
        if (!rootPageCache) {
            rootPageCache = renderRootPage(playgrounds, templates)!;
        }
        return rootPageCache;
    }

    function getPlaygroundPage(playground: Playground): string {
        let content = playgroundPagesCache.get(playground.name);
        if (!content) {
            content = renderPlaygroundPage(playground, templates)!;
            playgroundPagesCache.set(playground.name, content);
        }
        return content;
    }

    const handlers: DevServerHandler[] = [];

    handlers.push(
        {
            path: '/favicon.ico',
            handler: (_, res) => {
                res.send('favicon');
            },
        },
        {
            path: '/',
            handler: (_, res) => {
                res.send(getRootPage());
            },
        },
    );
    playgrounds.forEach((playground) => {
        handlers.push({
            path: `${PLAYGROUND_PATH}/${playground.name}/`,
            handler: (_, res) => {
                res.send(getPlaygroundPage(playground));
            },
        });
    });

    return handlers;
}

function renderRootPage(playgrounds: ReadonlyArray<Playground>, templates: ReadonlyMap<string, string>): string | null {
    const template = templates.get(ROOT_TEMPLATE_NAME);
    if (!template) {
        return null;
    }
    return Mustache.render(template, {
        title: 'WebGL Playground',
        bootstrap_styles_url: BOOTSTRAP_PATH,
        styles_url: `${ASSETS_PATH}/index.css`,
        bundle_url: `${ASSETS_PATH}/index.js`,
        playgrounds: playgrounds.map(
            ({ name, title }) => ({ url: `${PLAYGROUND_PATH}/${name}/`, title }),
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
        bootstrap_styles_url: BOOTSTRAP_PATH,
        styles_url: `${CONTENT_PATH}/playground.css`,
        bundle_url: `${ASSETS_PATH}/${name}.js`,
        worker_url: playground.worker ? `${ASSETS_PATH}/${name}_worker.js` : null,
        custom_markup: playground.markup ? templates.get(name)! : null,
    });
}

export function getPlaygroundItemPath(playground: string, item: string): string {
    return path.join(PLAYGROUND_DIR, playground, item);
}

export function collectTemplates(playgrounds: Iterable<Playground>): Template[] {
    const list: Template[] = [
        { name: ROOT_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, 'index.html') },
        { name: PLAYGROUND_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, 'playground.html') },
    ];
    for (const playground of playgrounds) {
        if (playground.markup) {
            list.push({ name: playground.name, path: getPlaygroundItemPath(playground.name, playground.markup) });
        }
    }
    return list;
}

function watchTemplates(
    playgrounds: ReadonlyArray<Playground>,
    templates: Map<string, string>,
    onChange: (name: string) => void,
): void {
    collectTemplates(playgrounds).forEach(({ name, path }) => {
        const readTemplate = (): void => {
            fs.readFile(path, 'utf8', (_err, data) => {
                if (data) {
                    templates.set(name, data);
                    onChange(name);
                }
            });
        };
        fs.watch(path, readTemplate);
        readTemplate();
    });
}

const NAME = 'html-assets-plugin';

export function htmlAssetsPlugin(playgrounds: ReadonlyArray<Playground>): WebpackPluginInstance {
    return {
        apply: (compiler) => {
            const templates = collectTemplates(playgrounds);
            const templateContents = new Map<string, string>();
            const templateIndex = new Map(templates.map((template) => [template.path, template]));
            compiler.hooks.compilation.tap(NAME, (compilation) => {
                templates.forEach((template) => {
                    compilation.fileDependencies.add(template.path);
                });
                const changedTemplates = findChangedTemplates(templateIndex, templateContents, compiler);
                if (changedTemplates.length === 0) {
                    return;
                }
                const changedAssets = findAffectedAssets(playgrounds, changedTemplates);
                updateTemplates(compiler, changedTemplates, templateContents)
                    .then(() => {
                        emitAssets(compiler, compilation, changedAssets, playgrounds, templateContents);
                    })
                    .catch((err) => {
                        compilation.errors.push(err as Error);
                    });
            });
        },
    };
}

function findChangedTemplates(
    templateIndex: ReadonlyMap<string, Template>,
    templateContents: Map<string, string>,
    compiler: Compiler,
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

function findAffectedAssets(
    playgrounds: ReadonlyArray<Playground>,
    changedTemplates: ReadonlyArray<Template>,
): string[] {
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

function emitAssets(
    compiler: Compiler,
    compilation: Compilation,
    assets: ReadonlyArray<string>,
    playgrounds: ReadonlyArray<Playground>,
    templateContents: ReadonlyMap<string, string>,
): void {
    const errors: string[] = [];
    for (const asset of assets) {
        let content: string | null;
        if (asset === ROOT_TEMPLATE_NAME) {
            content = renderRootPage(playgrounds, templateContents);
        } else {
            const playground = playgrounds.find((playground) => playground.name === asset)!;
            content = renderPlaygroundPage(playground, templateContents);
        }
        if (content) {
            const source = new compiler.webpack.sources.RawSource(content, false);
            compilation.emitAsset(`${asset}.html`, source);
        } else {
            errors.push(asset);
        }
    }
    if (errors.length > 0) {
        throw new Error(`no templates for assets: ${errors.join(', ')}`);
    }
}
