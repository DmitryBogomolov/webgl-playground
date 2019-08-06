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
    getBundleRoute, prettifyName,
} = require('./utils');
const config = require('./webpack.config');

const readFile = promisify(fs.readFile);

const PORT = process.env.PORT || 3000;
const ROOT_TEMPLATE = path.join(__dirname, '../static/root.html');
const PLAYGROUND_TEMPLATE = path.join(__dirname, '../static/playground.html');

function buildConfig(config, targets) {
    const result = Object.assign({}, config);
    result.entry = Object.assign({}, result.entry);
    targets.forEach((target) => {
        result.entry[target.name] = target.indexPath;
    });
    return result;
}

async function renderTemplate(templatePath, view) {
    const template = await readFile(templatePath, 'utf8');
    return Mustache.render(template, view);
}

async function runServer(targets) {
    const app = express();
    const patchedConfig = buildConfig(config, targets);
    const compiler = webpack(patchedConfig);

    app.get('/', async (_, res) => {
        console.log('Root');
        const content = await renderTemplate(ROOT_TEMPLATE, {
            targets: targets.map(target => ({
                title: prettifyName(target.name),
                path: `${PLAYGROUND_ROUTE}/${target.name}`,
            })),
            bundle: getBundleRoute('root'),
        });
        res.end(content);
    });

    app.get(`${PLAYGROUND_ROUTE}/:target`, async (req, res) => {
        const name = req.params.target;
        const target = targets.find(target => target.name === name);
        console.log('Playground', name);
        if (!target) {
            res.status(404).end('Unknown target.\n');
            return;
        }
        const content = await renderTemplate(PLAYGROUND_TEMPLATE, {
            title: prettifyName(target.name),
            bundle: getBundleRoute(target.name),
        });
        res.end(content);
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
            console.log(`Listening on port ${PORT}\n`);
            resolve();
        });
    });
}

exports.runServer = runServer;
