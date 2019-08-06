const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const fs = require('fs');
const config = require('../webpack.config');

const PORT = process.env.PORT || 3000;

const app = express();
const compiler = webpack(config);

app.get('/', (req, res) => {
    fs.createReadStream('./static/index.html').pipe(res);
});

app.use(webpackDevMiddleware(compiler, {
    publicPath: '/static',
}))

http.createServer(app).listen(PORT, (err) => {
    console.log(`Listening on port ${PORT}\n`);
});
