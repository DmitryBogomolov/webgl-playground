const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('../webpack.config');

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, '../static');
const INDEX_FILE = path.join(STATIC_DIR, 'index.html');

function buildConfig(config, targets) {
    const result = Object.assign({}, config);
    result.entry = Object.assign({}, result.entry);
    targets.forEach((target) => {
        result.entry[target.name] = target.indexPath;
    });
    return result;
}

async function runServer(targets) {
    const app = express();
    const patchedConfig = buildConfig(config, targets);
    const compiler = webpack(patchedConfig);
    const knownTargets = new Set(targets.map(target => target.name));

    app.get('/', (req, res) => {
        console.log('Root');
        fs.createReadStream(INDEX_FILE).pipe(res);
    });

    app.get('/playground/:target', (req, res) => {
        const target = req.params.target;
        console.log('Playground', target);
        if (!knownTargets.has(target)) {
            res.status(404).end('Unknown target.\n');
            return;
        }
        fs.createReadStream(INDEX_FILE).pipe(res);
    });
    
    app.use(webpackDevMiddleware(compiler, {
        publicPath: '/static',
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
