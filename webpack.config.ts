import type { Configuration, EntryObject } from 'webpack';
import type { /* for 'devServer' field */ } from 'webpack-dev-server';
import type { Playground } from './tools/playground.types';
import path from 'node:path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { buildRegistry } from './tools/registry-builder';
import {
    PLAYGROUND_DIR,
    STATIC_DIR,
    ROOT_TEMPLATE_TS_PATH,
    PLAYGROUND_TEMPLATE_TS_PATH,
    STATIC_PATH,
    htmlAssetsPlugin,
} from './tools/html-assets-plugin';

const PORT = Number(process.env.PORT) || 3001;

function buildEntry(playgrounds: ReadonlyArray<Playground>): EntryObject {
    const entry: EntryObject = {
        'index': {
            import: ROOT_TEMPLATE_TS_PATH,
            filename: '[name].js',
        },
    };

    const loaderPath = path.join(__dirname, './tools/playground-loader.ts');
    playgrounds.forEach((playground) => {
        const { name } = playground;
        entry[name] = {
            import: `!ts-loader!${loaderPath}?path=${playground.index}!${PLAYGROUND_TEMPLATE_TS_PATH}`,
            filename: 'playground/[name].js',
        };
        if (playground.worker) {
            entry[name + '_worker'] = {
                import: playground.worker,
                filename: 'playground/[name].js',
            };
        }
    });
    return entry;
}

function config(playgrounds: ReadonlyArray<Playground>): Configuration {
    const outputPath = path.join(__dirname, 'build');
    return {
        mode: 'development',
        devtool: 'inline-source-map',
        entry: buildEntry(playgrounds),
        output: {
            path: outputPath,
            library: {
                name: 'lib',
                type: 'umd',
            },
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
                    test: /\.(vert|frag|glsl)$/,
                    use: 'shader-loader',
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
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
            ],
        },
        resolveLoader: {
            alias: {
                'shader-loader': path.join(__dirname, './tools/shader-loader.ts'),
            },
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new CopyPlugin({
                patterns: [
                    {
                        from: STATIC_DIR,
                        to: path.join(outputPath, STATIC_PATH),
                    },
                ],
            }),
            htmlAssetsPlugin(playgrounds),
        ],
        devServer: {
            port: PORT,
            hot: false,
            liveReload: false,
            devMiddleware: {
                publicPath: '/',
            },
        },
    };
}

export default function (): Promise<Configuration> {
    return buildRegistry(PLAYGROUND_DIR).then(config);
}
