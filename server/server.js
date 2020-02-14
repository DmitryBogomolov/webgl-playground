const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const Mustache = require('mustache');
const { getOutputName, prettifyName, log } = require('./utils');
const WEBPACK_CONFIG = require('./webpack.config');

const readFile = promisify(fs.readFile);

const PORT = process.env.PORT || 3000;

const BASE_TEMPLATE_PATH = path.resolve('./static/index.html');
const ROOT_HEAD_TEMPLATE_PATH = path.resolve('./static/root_head.html');
const ROOT_BODY_TEMPLATE_PATH = path.resolve('./static/root_body.html');
const PLAYGROUND_HEAD_TEMPLATE_PATH = path.resolve('./static/playground_head.html');
const PLAYGROUND_BODY_TEMPLATE_PATH = path.resolve('./static/playground_body.html');
const CONTAINER_HEAD_TEMPLATE_PATH = path.resolve('./static/container_head.html');
const CONTAINER_BODY_TEMPLATE_PATH = path.resolve('./static/container_body.html');

const ROOT_TARGET_NAME = 'root';
const ROOT_ENTRY_PATH = path.resolve('./static/index.js');
const STATIC_ROUTE = '/static';
const PLAYGROUND_ROUTE = '/playground';

function getBundleRoute(name) {
    return `${STATIC_ROUTE}/${getOutputName(name)}`;
}

function buildConfig(config, targets) {
    const entry = { [ROOT_TARGET_NAME]: ROOT_ENTRY_PATH };
    targets.forEach((target) => {
        entry[target.name] = target.indexPath;
    });
    return { ...config, entry };
}

function loadTemplates(fileNames) {
    return Promise.all(
        fileNames.map((fileName) => readFile(fileName, 'utf8').catch((e) => {
            if (e.code === 'ENOENT') {
                return '';
            }
            throw e;
        }))
    );
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
            title: prettifyName(target.name),
            path: `${PLAYGROUND_ROUTE}/${target.name}`,
        })),
        bundle: getBundleRoute(ROOT_TARGET_NAME),        
    };
    return Mustache.render(baseTemplate, view, { head, body });
}

async function renderPlaygroundPage(target) {
    const dirPath = path.dirname(target.indexPath);
    const [baseTemplate, head, body, containerHead, containerBody, customHead, customBody] = await loadTemplates([
        BASE_TEMPLATE_PATH,
        PLAYGROUND_HEAD_TEMPLATE_PATH,
        PLAYGROUND_BODY_TEMPLATE_PATH,
        CONTAINER_HEAD_TEMPLATE_PATH,
        CONTAINER_BODY_TEMPLATE_PATH,
        path.join(dirPath, 'head.html'),
        path.join(dirPath, 'body.html'),
    ]);
    const view = {
        title: prettifyName(target.name),
        bundle: getBundleRoute(target.name),
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

async function runServer(targets) {
    const app = express();
    const patchedConfig = buildConfig(WEBPACK_CONFIG, targets);
    const compiler = webpack(patchedConfig);

    app.get('/', async (_, res) => {
        log('root');
        const content = await renderRootPage(targets);
        res.end(content);
        log(INDENT, 'ok');
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
        const content = await renderPlaygroundPage(target);
        res.end(content);
        log(INDENT, 'ok');
    });
    
    app.use(webpackDevMiddleware(compiler, {
        publicPath: STATIC_ROUTE,
    }));

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

module.exports = {
    runServer,
};
