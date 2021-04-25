import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Configuration } from 'webpack';

const config: Configuration = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'index': path.join(__dirname, './templates/index.ts'),
        '01_simple_rects': path.join(__dirname, './playground/01_simple_rects/index.ts'),
        '02_basic_texture': path.join(__dirname, './playground/02_basic_texture/index.ts'),
        '03_worker': path.join(__dirname, './playground/03_worker/index.ts'),
        '03_worker_worker': path.join(__dirname, './playground/03_worker/worker.ts'),
    },
    output: {
        path: path.join(__dirname, './build'),
        // filename: 'lib.js',
        library: 'lib',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            lib: path.join(__dirname, './lib/index.ts'),
        },
    },
    devServer: {
        compress: true,
        port: 3001,
        publicPath: '/static',
        contentBase: path.join(__dirname, './static'),
        contentBasePublicPath: '/static',
        index: path.join(__dirname, './templates/index.html'),
        before: (app) => {
            app.get('/test', (_req, res) => {
                res.json({ message: 'Hello' });
            });
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
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

export default config;
