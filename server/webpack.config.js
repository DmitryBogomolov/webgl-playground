const path = require('path');
const { DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const baseConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
};

const libConfig = {
    ...baseConfig,
    entry: './lib/index.js',
    output: {
        path: path.resolve('./dist-lib'),
        filename: 'lib.js',
        library: 'lib',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
};

const pageConfig = {
    ...baseConfig,
    output: {
        path: path.resolve('./dist'),
    },
    resolve: {
        alias: {
            lib: path.resolve('./dist-lib/lib.js'),
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

module.exports = {
    libConfig,
    pageConfig,
};
