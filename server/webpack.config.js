const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const baseConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
};

const libConfig = {
    ...baseConfig,
    entry: './lib/index.js',
    output: {
        path: path.resolve('./dist'),
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
            lib: path.join(libConfig.output.path, 'lib.js'),
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
    ],
};

module.exports = {
    libConfig,
    pageConfig,
};
