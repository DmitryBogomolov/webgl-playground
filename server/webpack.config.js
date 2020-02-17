const path = require('path');
const { DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { getOutputName } = require('./utils');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        filename: getOutputName('[name]'),
        path: path.join(__dirname, '../dist'),
    },
    resolve: {
        alias: {
            lib: path.join(__dirname, '../lib'),
        },
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
            },
            {
                test: /\.(vert|frag)$/,
                use: ['raw-loader'],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin({
            PLAYGROUND_ROOT: JSON.stringify('#playground-root'),
        }),
    ],
};
