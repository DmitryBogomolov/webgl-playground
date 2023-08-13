import type { Compiler, Configuration, EntryObject } from 'webpack';
import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssWebpackPlugin from 'mini-css-extract-plugin';
import type { Playground } from './tools/playground.types';
import {
    TEMPLATES_DIR, CONTENT_PATH, ASSETS_PATH,
    setupHandlers, collectTemplates, getPlaygroundItemPath,
} from './tools/dev-server';
// @ts-ignore Raw content.
import playgroundRegistry from './tools/playground-registry.json';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const playgrounds: Playground[] = playgroundRegistry;

const PORT = Number(process.env.PORT) || 3001;

function buildEntry(): EntryObject {
    const entry: EntryObject = {
        'index': path.join(TEMPLATES_DIR, 'index.ts'),
    };

    playgrounds.forEach((playground) => {
        const { name } = playground;
        entry[name] = [
            path.join(TEMPLATES_DIR, 'screenshot-button.ts'),
            getPlaygroundItemPath(name, playground.index),
        ];
        if (playground.worker) {
            entry[name + '_worker'] = getPlaygroundItemPath(name, playground.worker);
        }
    });
    return entry;
}

const config: Configuration = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: buildEntry(),
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
            lib: path.join(__dirname, './src/index.ts'),
            'playground-utils': path.join(__dirname, './playground-utils/'),
        },
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
                use: [
                    {
                        loader: MiniCssWebpackPlugin.loader,
                        options: {
                            esModule: true,
                        },
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: true,
                            modules: {
                                // namedExport: true,
                                localIdentName: '[name]__[local]',
                            },
                        },
                    },
                ],
            },
            {
                test: /\.(vert|frag|glsl)$/,
                use: 'shader-loader',
            },
        ],
    },
    resolveLoader: {
        alias: {
            'shader-loader': path.resolve(__dirname, './tools/shader-loader.ts'),
        },
    },
    plugins: [
        new CleanWebpackPlugin({ dry: false, dangerouslyAllowCleanPatternsOutsideProject: true }),
        new MiniCssWebpackPlugin(),
        // Without it "[WDS] Nothing changed" (in browser console) is reported when template files are updated.
        // As a result hot reload does not happen and page content is not updated.
        // Somehow "HtmlWebpackPlugin" solves this.
        new HtmlWebpackPlugin(),
        {
            apply(compiler: Compiler): void {
                compiler.hooks.afterCompile.tap('watch-templates', (compilation) => {
                    const items = collectTemplates(playgrounds).map(({ path }) => path);
                    compilation.fileDependencies.addAll(items);
                });
            },
        },
    ],
    devServer: {
        port: PORT,
        devMiddleware: {
            publicPath: `${ASSETS_PATH}/`,
        },
        static: {
            directory: path.join(__dirname, './static'),
            publicPath: `${CONTENT_PATH}/`,
        },
        setupMiddlewares: (middlewares, devServer) => {
            setupHandlers(devServer.app!, playgrounds);
            return middlewares;
        },
    },
};

export default config;
