import type { Configuration, EntryObject, WebpackPluginInstance } from 'webpack';
import type { Playground } from './tools/playground.types';
import path from 'path';
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

    const filePath = path.join(TEMPLATES_DIR, 'playground.ts');
    const loaderPath = path.join(__dirname, './tools/playground-loader.ts');

    playgrounds.forEach((playground) => {
        const { name } = playground;
        const indexPath = getPlaygroundItemPath(name, playground.index);
        entry[name] = {
            import: `!ts-loader!${loaderPath}?path=${indexPath}!${filePath}`,
        };
        if (playground.worker) {
            const workerPath = getPlaygroundItemPath(name, playground.worker);
            entry[name + '_worker'] = {
                import: workerPath,
            };
        }
    });
    return entry;
}

function watchPlugin(playgrounds: ReadonlyArray<Playground>): WebpackPluginInstance {
    return {
        apply(compiler) {
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
            clean: true,
        },
        resolve: {
            extensions: ['.ts', '.js'],
            tsconfig: path.join(__dirname, './tsconfig.json'),
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
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    namedExport: false,
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
            new MiniCssWebpackPlugin(),
            watchPlugin(playgrounds),
        ],
        devServer: {
            port: PORT,
            hot: false,
            liveReload: false,
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

export default function (): Promise<Configuration> {
    return buildRegistry(path.join(__dirname, './playground')).then(config);
}
