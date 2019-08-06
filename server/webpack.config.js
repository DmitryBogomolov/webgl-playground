const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { getOutputName } = require('./utils');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        root: './src/index.js',
    },
    output: {
        filename: getOutputName('[name]'),
        path: path.join(__dirname, 'dist'),
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
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
};
