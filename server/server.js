const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const Mustache = require('mustache');
const { 
    PLAYGROUND_ROUTE, STATIC_ROUTE,
    getBundleRoute, prettifyName, log,
} = require('./utils');
const WEBPACK_CONFIG = require('./webpack.config');

const readFile = promisify(fs.readFile);

const PORT = process.env.PORT || 3000;
const ROOT_TEMPLATE = path.join(__dirname, '../static/root.html');
const PLAYGROUND_TEMPLATE = path.join(__dirname, '../static/playground.html');

function buildConfig(config, targets) {
    const result = { ...config };
    result.entry = { ...result.entry };
    targets.forEach((target) => {
        result.entry[target.name] = target.indexPath;
    });
    return result;
}

async function renderTemplate(templatePath, view) {
    const template = await readFile(templatePath, 'utf8');
    return Mustache.render(template, view, {
        container: '<div class="container"></div>\n',
    });
}

const INDENT = '  ';

async function runServer(targets) {
    const app = express();
    const patchedConfig = buildConfig(WEBPACK_CONFIG, targets);
    const compiler = webpack(patchedConfig);

    app.get('/', async (_, res) => {
        log('root');
        const content = await renderTemplate(ROOT_TEMPLATE, {
            targets: targets.map(target => ({
                title: prettifyName(target.name),
                path: `${PLAYGROUND_ROUTE}/${target.name}`,
            })),
            bundle: getBundleRoute('root'),
        });
        res.end(content);
        log(INDENT, 'ok');
    });

    app.get(`${PLAYGROUND_ROUTE}/:target`, async (req, res) => {
        const name = req.params.target;
        const target = targets.find(target => target.name === name);
        log('sample', name);
        if (!target) {
            res.status(404).end('Unknown target.\n');
            log(INDENT, 'not found');
            return;
        }
        const content = await renderTemplate(PLAYGROUND_TEMPLATE, {
            title: prettifyName(target.name),
            bundle: getBundleRoute(target.name),
        });
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

exports.runServer = runServer;
