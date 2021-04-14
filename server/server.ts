import path from 'path';
import fs from 'fs';
import http from 'http';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import Mustache from 'mustache';
import { log, error } from './utils';
import webpackConfig from './webpack.config';
import { Target } from './collector';

const { readFile } = fs.promises;

const PORT = Number(process.env.PORT) || 3001;

const BASE_TEMPLATE_PATH = path.resolve('./templates/index.html');
const ROOT_HEAD_TEMPLATE_PATH = path.resolve('./templates/root_head.html');
const ROOT_BODY_TEMPLATE_PATH = path.resolve('./templates/root_body.html');
const PLAYGROUND_HEAD_TEMPLATE_PATH = path.resolve('./templates/playground_head.html');
const PLAYGROUND_BODY_TEMPLATE_PATH = path.resolve('./templates/playground_body.html');
const CONTAINER_HEAD_TEMPLATE_PATH = path.resolve('./templates/container_head.html');
const CONTAINER_BODY_TEMPLATE_PATH = path.resolve('./templates/container_body.html');

const HOME_TARGET_NAME = 'home';
const HOME_ENTRY_PATH = path.resolve('./templates/index.js');
const STATIC_ROUTE = '/static';
const PLAYGROUND_ROUTE = '/playground';

function getBundleRoute(name: string) {
    return `${STATIC_ROUTE}/${name}.js`;
}

function buildConfig(baseConfig: webpack.Configuration, targets: Target[]): webpack.Configuration {
    const config: webpack.Configuration = { ...baseConfig };
    const entry: webpack.Entry = config.entry = {
        ...(config.entry as webpack.Entry),
        [HOME_TARGET_NAME]: HOME_ENTRY_PATH,
    };
    targets.forEach((target) => {
        entry[target.name] = path.join(target.path, 'index.js');
        if (target.hasWorker) {
            entry[target.name + '_worker'] = path.join(target.path, 'worker.js');
        }
    });
    return config;
}

async function loadTemplates(fileNames: string[]): Promise<string[]> {
    const contents = await Promise.all(
        fileNames.map(async (fileName) => {
            try {
                const content = await readFile(fileName, 'utf8');
                return content;
            } catch (e) {
                if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
                    return '';
                }
                throw e;
            }
        }),
    );
    return contents;
}

async function renderRootPage(targets: Target[]): Promise<string> {
    const [baseTemplate, head, body] = await loadTemplates([
        BASE_TEMPLATE_PATH,
        ROOT_HEAD_TEMPLATE_PATH,
        ROOT_BODY_TEMPLATE_PATH,
    ]);
    const view = {
        title: 'WebGL playground',
        targets: targets.map((target) => ({
            title: target.name,
            path: `${PLAYGROUND_ROUTE}/${target.name}`,
        })),
        bundle: getBundleRoute(HOME_TARGET_NAME),        
    };
    return Mustache.render(baseTemplate, view, { head, body });
}

function buildCustomScript(target: Target): string {
    const lines = [];
    lines.push('<script>');
    lines.push(`PLAYGROUND_ROOT = ${JSON.stringify('#playground-root')};`);
    if (target.hasWorker) {
        lines.push(`WORKER_URL = ${JSON.stringify(getBundleRoute(target.name + '_worker'))};`);
    }
    lines.push('</script>');
    return lines.join('\n');
}

function renderPart(
    partTemplate: string, view: Record<string, string>, basePartTemplate: string, partKey: string,
): string {
    return partTemplate
        ? Mustache.render(partTemplate, view, { [partKey]: basePartTemplate })
        : basePartTemplate;
}

async function renderPlaygroundPage(target: Target): Promise<string> {
    const [
        baseTemplate,
        headTemplate,
        bodyTemplate,
        containerHeadTemplate,
        containerBodyTemplate,
        customHeadTemplate,
        customBodyTemplate,
    ] = await loadTemplates([
        BASE_TEMPLATE_PATH,
        PLAYGROUND_HEAD_TEMPLATE_PATH,
        PLAYGROUND_BODY_TEMPLATE_PATH,
        CONTAINER_HEAD_TEMPLATE_PATH,
        CONTAINER_BODY_TEMPLATE_PATH,
        path.join(target.path, 'head.html'),
        path.join(target.path, 'body.html'),
    ]);
    const view = {
        title: target.name,
        bundle: getBundleRoute(target.name),
        custom_script: buildCustomScript(target),
    };
    const partials = {
        head: headTemplate,
        body: bodyTemplate,
        container_head: renderPart(customHeadTemplate, view, containerHeadTemplate, 'container_head'),
        container_body: renderPart(customBodyTemplate, view, containerBodyTemplate, 'container_body'),
    };
    return Mustache.render(baseTemplate, view, partials);
}

const INDENT = '  ';

function startListening(app: express.Express): Promise<void> {
    return new Promise((resolve, _reject) => {
        http.createServer(app).listen(PORT, () => {
            log(`Listening ${PORT}\n`);
            resolve();
        });
    });
}

export async function runServer(targets: Target[]): Promise<void> {
    const compiler = webpack(buildConfig(webpackConfig, targets));

    const app = express();

    app.get('/', async (_, res) => {
        log('root');
        try {
            const content = await renderRootPage(targets);
            res.end(content);
            log(INDENT, 'ok');
        } catch (err) {
            res.status(500);
            res.end('Internal server error.\n');
            error(INDENT, err);
        }
    });

    app.get(`${PLAYGROUND_ROUTE}/:target`, async (req, res) => {
        const name = req.params.target;
        const target = targets.find((target) => target.name === name);
        log('playground', name);
        if (!target) {
            res.status(404).end('Unknown target.\n');
            log(INDENT, 'not found');
            return;
        }
        try {
            const content = await renderPlaygroundPage(target);
            res.end(content);
            log(INDENT, 'ok');
        } catch (err) {
            res.status(500);
            res.end('Internal server error.\n');
            error(INDENT, err);
        }
    });

    app.use(webpackDevMiddleware(compiler, { publicPath: STATIC_ROUTE }));
    app.use(STATIC_ROUTE, express.static(path.resolve('./static')));

    await startListening(app);
}
