import type { Configuration, EntryObject, WebpackPluginInstance } from 'webpack';
import type { Playground } from './tools/playground.types';
import path from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssWebpackPlugin from 'mini-css-extract-plugin';
import { buildRegistry } from './tools/registry-builder';
import {
    TEMPLATES_DIR, CONTENT_PATH, ASSETS_PATH,
    setupHandlers, collectTemplates, getPlaygroundItemPath,
} from './tools/dev-server';

const PORT = Number(process.env.PORT) || 3001;

function buildEntry(playgrounds: ReadonlyArray<Playground>): EntryObject {
    const entry: EntryObject = {
        'index': {
            import: path.join(TEMPLATES_DIR, 'index.ts'),
        },
    };

    playgrounds.forEach((playground) => {
        const { name } = playground;
        entry[name] = {
            import: [
                path.join(TEMPLATES_DIR, 'screenshot-button.ts'),
                getPlaygroundItemPath(name, playground.index),
            ],
        };
        if (playground.worker) {
            entry[name + '_worker'] = {
                import: getPlaygroundItemPath(name, playground.worker),
            };
        }
    });
    return entry;
}

function watchPlugin(playgrounds: ReadonlyArray<Playground>): WebpackPluginInstance {
    return {
        apply(compiler): void {
            compiler.hooks.afterCompile.tap('watch-templates', (compilation) => {
                const items = collectTemplates(playgrounds).map(({ path }) => path);
                compilation.fileDependencies.addAll(items);
            });
        },
    };
}

function config(playgrounds: ReadonlyArray<Playground>): Configuration {
    return {
        mode: 'development',
        devtool: 'inline-source-map',
        entry: buildEntry(playgrounds),
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
                'shader-loader': path.join(__dirname, './tools/shader-loader.ts'),
            },
        },
        plugins: [
            new CleanWebpackPlugin({ dry: false, dangerouslyAllowCleanPatternsOutsideProject: true }),
            new MiniCssWebpackPlugin(),
            // Without it "[WDS] Nothing changed" (in browser console) is reported when template files are updated.
            // As a result hot reload does not happen and page content is not updated.
            // Somehow "HtmlWebpackPlugin" solves this.
            new HtmlWebpackPlugin(),
            watchPlugin(playgrounds),
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
}

export default async function (): Promise<Configuration> {
    const playgrounds = await buildRegistry(path.join(__dirname, './playground'));
    return config(playgrounds);
}
