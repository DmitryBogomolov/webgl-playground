const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const http = require('http');
const express = require('express');
const webpack = require('webpack');
const Mustache = require('mustache');
const { log, error } = require('./utils');
const { libConfig, pageConfig } = require('./webpack.config');

const readFile = promisify(fs.readFile);

const PORT = process.env.PORT || 3000;

const BASE_TEMPLATE_PATH = path.resolve('./static/index.html');
const ROOT_HEAD_TEMPLATE_PATH = path.resolve('./static/root_head.html');
const ROOT_BODY_TEMPLATE_PATH = path.resolve('./static/root_body.html');
const PLAYGROUND_HEAD_TEMPLATE_PATH = path.resolve('./static/playground_head.html');
const PLAYGROUND_BODY_TEMPLATE_PATH = path.resolve('./static/playground_body.html');
const CONTAINER_HEAD_TEMPLATE_PATH = path.resolve('./static/container_head.html');
const CONTAINER_BODY_TEMPLATE_PATH = path.resolve('./static/container_body.html');
const BOOTSTRAP_CSS_PATH = path.resolve('./static/bootstrap.min.css');

const HOME_TARGET_NAME = 'home';
const HOME_ENTRY_PATH = path.resolve('./static/index.js');
const STATIC_ROUTE = '/static';
const PLAYGROUND_ROUTE = '/playground';

function getBundleRoute(name) {
    return `${STATIC_ROUTE}/${name}.js`;
}

function buildConfig(config, targets) {
    const entry = {
        [HOME_TARGET_NAME]: HOME_ENTRY_PATH,
    };
    targets.forEach((target) => {
        entry[target.name] = path.join(target.path, 'index.js');
    });
    return { ...config, entry };
}

function loadTemplates(fileNames) {
    return Promise.all(
        fileNames.map((fileName) => readFile(fileName, 'utf8').catch((e) => {
            if (e.code === 'ENOENT') {
                return null;
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
            title: target.name,
            path: `${PLAYGROUND_ROUTE}/${target.name}`,
        })),
        bundle: getBundleRoute(HOME_TARGET_NAME),        
    };
    return Mustache.render(baseTemplate, view, { head, body });
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

async function runCompilation(targets) {
    let notifyLibBuilt;
    const promise = new Promise((resolve) => {
        notifyLibBuilt = resolve;
    });

    const libCompiler = webpack(libConfig);
    libCompiler.watch({}, (err, stats) => {
        if (err) {
            error(err);
        } else {
            log(stats.toString());
            notifyLibBuilt();
        }
    });

    await promise;

    const patchedConfig = buildConfig(pageConfig, targets);
    const pagesСompiler = webpack(patchedConfig);
    pagesСompiler.watch({}, (err, stats) => {
        if (err) {
            error(err);
        } else {
            log(stats.toString());
        }
    });
}

async function runServer(targets) {
    await runCompilation(targets);

    const app = express();

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

    app.use(STATIC_ROUTE, express.static(path.resolve('./dist')));

    // TODO: Use `static` for this.
    app.get(`${STATIC_ROUTE}/bootstrap.min.css`, (_, res) => {
        fs.createReadStream(BOOTSTRAP_CSS_PATH).pipe(res);
    });

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
