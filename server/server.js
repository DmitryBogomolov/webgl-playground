const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const Mustache = require('mustache');
const { log, error } = require('./utils');
const webpackConfig = require('./webpack.config');

const readFile = promisify(fs.readFile);

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

function getBundleRoute(name) {
    return `${STATIC_ROUTE}/${name}.js`;
}

function buildConfig(baseConfig, targets) {
    const config = { ...baseConfig };
    const entry = config.entry = {
        ...config.entry,
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

async function loadTemplates(fileNames) {
    const contents = await Promise.all(
        fileNames.map(async (fileName) => {
            try {
                const content = await readFile(fileName, 'utf8');
                return content;
            } catch (e) {
                if (e.code === 'ENOENT') {
                    return null;
                }
                throw e;
            }
        }),
    );
    return contents;
}

async function renderRootPage(targets) {
    const [baseTemplate, head, body] = await loadTemplates([
        BASE_TEMPLATE_PATH,
        ROOT_HEAD_TEMPLATE_PATH,
        ROOT_BODY_TEMPLATE_PATH,
    ]);
    const view = {
        title: 'WebGL playground',
        targets: targets.map(target => ({
            title: target.name,
            path: `${PLAYGROUND_ROUTE}/${target.name}`,
        })),
        bundle: getBundleRoute(HOME_TARGET_NAME),        
    };
    return Mustache.render(baseTemplate, view, { head, body });
}

function buildCustomScript(target) {
    const lines = [];
    lines.push('<script>');
    lines.push(`PLAYGROUND_ROOT = ${JSON.stringify('#playground-root')};`);
    if (target.hasWorker) {
        lines.push(`WORKER_URL = ${JSON.stringify(getBundleRoute(target.name + '_worker'))};`);
    }
    lines.push('</script>');
    return lines.join('\n');
}

async function renderPlaygroundPage(target) {
    const [
        baseTemplate, head, body,
        containerHead, containerBody, customHead, customBody,
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
        head,
        body,
        container_head: customHead
            ? Mustache.render(customHead, view, { container_head: containerHead }) : containerHead,
        container_body: customBody
            ? Mustache.render(customBody, view, { container_body: containerBody }) : containerBody,
    };
    return Mustache.render(baseTemplate, view, partials );
}

const INDENT = '  ';

function startListening(app) {
    return new Promise((resolve, reject) => {
        http.createServer(app).listen(PORT, (err) => {
            if (err) {
                reject(err);
                return;
            }
            log(`Listening ${PORT}\n`);
            resolve();
        });
    });
}

async function runServer(targets) {
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
        const target = targets.find(target => target.name === name);
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

module.exports = {
    runServer,
};
