import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import type { Playground, Template } from './playground.types';
import path from 'path';
import fs from 'fs';
import Mustache from 'mustache';

export type Application =
    NonNullable<Parameters<NonNullable<DevServerConfiguration['onBeforeSetupMiddleware']>>[0]['app']>;

export const CONTENT_PATH = '/static';
export const ASSETS_PATH = '/assets';
const BOOTSTRAP_PATH = `${CONTENT_PATH}/bootstrap.min.css`;
const PLAYGROUND_PATH = '/playground';

export const TEMPLATES_DIR = path.join(__dirname, '../templates');
const PLAYGROUND_DIR = path.join(__dirname, '../playground');

const ROOT_TEMPLATE_NAME = 'index';
const PLAYGROUND_TEMPLATE_NAME = 'playground';

export function setupHandlers(app: Application, playgrounds: ReadonlyArray<Playground>): void {
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
            rootPageCache = renderRootPage(playgrounds, templates);
        }
        return rootPageCache;
    }

    function getPlaygroundPage(playground: Playground): string {
        let content = playgroundPagesCache.get(playground.name);
        if (!content) {
            content = renderPlaygroundPage(playground, templates);
            playgroundPagesCache.set(playground.name, content);
        }
        return content;
    }

    app.get('/favicon.ico', (_, res) => {
        res.send('favicon');
    });
    app.get('/', (_req, res) => {
        res.send(getRootPage());
    });
    playgrounds.forEach((playground) => {
        app.get(`${PLAYGROUND_PATH}/${playground.name}/`, (_req, res) => {
            res.send(getPlaygroundPage(playground));
        });
    });
}

function renderRootPage(playgrounds: ReadonlyArray<Playground>, templates: ReadonlyMap<string, string>): string {
    return Mustache.render(templates.get(ROOT_TEMPLATE_NAME)!, {
        title: 'WebGL Playground',
        bootstrap_url: BOOTSTRAP_PATH,
        bundle_url: `${ASSETS_PATH}/index.js`,
        styles_url: `${ASSETS_PATH}/index.css`,
        playgrounds: playgrounds.map(
            ({ name, title }) => ({ url: `${PLAYGROUND_PATH}/${name}/`, title }),
        ),
    });
}

function renderPlaygroundPage(playground: Playground, templates: ReadonlyMap<string, string>): string {
    const { name } = playground;
    return Mustache.render(templates.get(PLAYGROUND_TEMPLATE_NAME)!, {
        name,
        title: playground.title,
        bootstrap_url: BOOTSTRAP_PATH,
        bundle_url: `${ASSETS_PATH}/${name}.js`,
        styles_url: `${ASSETS_PATH}/${name}.css`,
        worker_url: playground.worker ? `${ASSETS_PATH}/${name}_worker.js` : null,
        custom_markup: playground.markup ? templates.get(name)! : null,
    });
}

export function getPlaygroundItemPath(playground: string, item: string): string {
    return path.join(PLAYGROUND_DIR, playground, item);
}

export function collectTemplates(playgrounds: ReadonlyArray<Playground>): Template[] {
    const list: Template[] = [
        { name: ROOT_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, 'index.html') },
        { name: PLAYGROUND_TEMPLATE_NAME, path: path.join(TEMPLATES_DIR, 'playground.html') },
    ];
    playgrounds.forEach((playground) => {
        if (playground.markup) {
            list.push({ name: playground.name, path: getPlaygroundItemPath(playground.name, playground.markup) });
        }
    });
    return list;
}

function watchTemplates(
    playgrounds: ReadonlyArray<Playground>, templates: Map<string, string>, onChange: (name: string) => void,
): void {
    collectTemplates(playgrounds).forEach(({ name, path }) => {
        function readTemplate(): void {
            fs.readFile(path, 'utf8', (_err, data) => {
                templates.set(name, data);
                onChange(name);
            });
        }
        fs.watch(path, readTemplate);
        readTemplate();
    });
}
