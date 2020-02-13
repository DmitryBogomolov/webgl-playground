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

const BASE_TEMPLATE = path.resolve('./static/index.html');
const ROOT_HEAD_TEMPLATE = path.resolve('./static/root_head.html');
const ROOT_BODY_TEMPLATE = path.resolve('./static/root_body.html');
const PLAYGROUND_HEAD_TEMPLATE = path.resolve('./static/playground_head.html');
const PLAYGROUND_BODY_TEMPLATE = path.resolve('./static/playground_body.html');

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
        fileNames.map((fileName) => readFile(fileName, 'utf8'))
    );
}

async function renderTemplate(baseTemplatePath, nestedTemplatesCache, view) {
    const nestedTemplateNames = Object.keys(nestedTemplatesCache);
    const [baseTemplate, ...nestedTemplates] = await loadTemplates([
        baseTemplatePath,
        ...nestedTemplateNames.map((name) => nestedTemplatesCache[name])
    ]);
    const partials = {};
    nestedTemplateNames.forEach((name, i) => {
        partials[name] = nestedTemplates[i];
    });
    return Mustache.render(baseTemplate, view, partials);
}

const INDENT = '  ';

async function runServer(targets) {
    const app = express();
    const patchedConfig = buildConfig(WEBPACK_CONFIG, targets);
    const compiler = webpack(patchedConfig);

    app.get('/', async (_, res) => {
        log('root');
        const content = await renderTemplate(
            BASE_TEMPLATE,
            {
                head: ROOT_HEAD_TEMPLATE,
                body: ROOT_BODY_TEMPLATE,
            },
            {
                title: 'WebGL playground',
                targets: targets.map(target => ({
                    title: prettifyName(target.name),
                    path: `${PLAYGROUND_ROUTE}/${target.name}`,
                })),
                bundle: getBundleRoute(ROOT_TARGET_NAME),
            }
        );
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
        const content = await renderTemplate(
            BASE_TEMPLATE,
            {
                head: PLAYGROUND_HEAD_TEMPLATE,
                body: PLAYGROUND_BODY_TEMPLATE,
            },
            {
                title: prettifyName(target.name),
                bundle: getBundleRoute(target.name),
            }
        );
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
