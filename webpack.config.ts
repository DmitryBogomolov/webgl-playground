import path from 'path';
import fs from 'fs';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Compiler, Configuration, EntryObject } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Mustache from 'mustache';

interface Playground {
    readonly name: string;
    readonly title: string;
    readonly hasWorker: boolean;
}

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PLAYGROUND_DIR = path.join(__dirname, 'playground');

function capitalizeWord(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

const playgrounds: Playground[] = [];
fs.readdirSync(PLAYGROUND_DIR).forEach((dirName) => {
    if (fs.existsSync(path.join(PLAYGROUND_DIR, dirName, 'index.ts'))) {
        playgrounds.push({
            name: dirName,
            title: dirName.replace(/_/g, ' ').replace(/\w\S*/g, capitalizeWord),
            hasWorker: fs.existsSync(path.join(PLAYGROUND_DIR, dirName, 'worker.ts')),
        });
    }
});

const entry: EntryObject = {
    'index': path.join(TEMPLATES_DIR, 'index.ts'),
};

playgrounds.forEach((playground) => {
    entry[playground.name] = path.join(PLAYGROUND_DIR, playground.name, '/index.ts');
    if (playground.hasWorker) {
        entry[playground.name + '_worker'] = path.join(PLAYGROUND_DIR, playground.name + '/worker.ts');
    }
});

const config: Configuration = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry,
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
        publicPath: '/assets/',
        contentBase: path.join(__dirname, './static'),
        contentBasePublicPath: '/static/',
        index: 'index.html',
        before: (app, _server, compiler) => {
            let rootSource: string;
            const playgroundSources: Record<string, string> = {};

            compiler.hooks.emit.tap('my-test', ({ assets }) => {
                rootSource = assets['index.html'].source() as string;
                playgrounds.forEach(({ name }) => {
                    playgroundSources[name] = assets[`${name}.html`].source() as string;
                });
            });

            let rootContent = '';

            fs.watch(path.join(TEMPLATES_DIR, 'index_.html'), updateRoot);
            updateRoot();

            function updateRoot(): void {
                fs.promises.readFile(path.join(TEMPLATES_DIR, 'index_.html'), 'utf8').then((template) => {
                    rootContent = Mustache.render(template, {
                        title: 'WebGL Playground',
                        bootstrap_url: '/static/bootstrap.min.css',
                        bundle_url: '/assets/index.js',
                        playground_path: 'playground',
                        playgrounds: playgrounds.map(({ name }) => `/playground/${name}/`),
                    });
                });
            }

            const playgroundContents = new Map<string, string>();

            fs.watch(path.join(TEMPLATES_DIR, 'playground_.html'), updatePlayground);
            updatePlayground();

            function updatePlayground(): void {
                fs.promises.readFile(path.join(TEMPLATES_DIR, 'playground_.html'), 'utf8').then((template) => {
                    playgrounds.forEach(({ name, title, hasWorker }) => {
                        const content = Mustache.render(template, {
                            title,
                            bootstrap_url: '/static/bootstrap.min.css',
                            bundle_url: `/assets/${name}.js`,
                            worker_url: hasWorker ? `/assets/${name}_worker.js` : null,
                        });
                        playgroundContents.set(name, content);
                    });
                });
            }

            // compiler.hooks.afterEmit.tapAsync('write-file-webpack-plugin', handleAfterEmit);
            // compilation.assets
            app.get('/', (_req, res) => {
                res.send(rootSource);
            });
            app.get('/root/', (_req, res) => {
                res.send(rootContent);
            });
            playgrounds.forEach(({ name }) => {
                app.get(`/playground/${name}/`, (_req, res) => {
                    res.send(playgroundSources[name]);
                });
                app.get(`/playground_/${name}/`, (_req, res) => {
                    res.send(playgroundContents.get(name));
                });
            });
            app.get('/test', (_req, res) => {
                res.json({ message: 'Hello' });
            });
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
        new HtmlWebpackPlugin({
            title: 'WebGL playground',
            filename: 'index.html',
            inject: false,
            template: path.join(__dirname, './templates/index.html'),
            templateParameters: {
                title: 'WebGL Playground',
                bootstrap_url: '/static/bootstrap.min.css',
                bundle_url: '/assets/index.js',
                playgrounds,
            },
        }),
        new HtmlWebpackPlugin({
            title: '01 Simple Rects',
            filename: '01_simple_rects.html',
            inject: false,
            template: path.join(__dirname, './templates/playground.html'),
            templateParameters: {
                title: '01 Simple Rects',
                bootstrap_url: '/static/bootstrap.min.css',
                bundle_url: '/assets/01_simple_rects.js',
                worker_url: null,
            },
        }),
        new HtmlWebpackPlugin({
            title: '02 Basic Texture',
            filename: '02_basic_texture.html',
            inject: false,
            template: path.join(__dirname, './templates/playground.html'),
            templateParameters: {
                title: '02 Basic Texture',
                bootstrap_url: '/static/bootstrap.min.css',
                bundle_url: '/assets/02_basic_texture.js',
                worker_url: null,
            },
        }),
        new HtmlWebpackPlugin({
            title: '03 Worker',
            filename: '03_worker.html',
            inject: false,
            template: path.join(__dirname, './templates/playground.html'),
            templateParameters: {
                title: '03 Worker',
                bootstrap_url: '/static/bootstrap.min.css',
                bundle_url: '/assets/03_worker.js',
                worker_url: '/assets/03_worker_worker.js',
            },
        }),
        {
            apply(compiler: Compiler) {
                compiler.hooks.afterCompile.tap('CustomWatch', (compilation) => {
                    compilation.fileDependencies.addAll([
                        path.join(TEMPLATES_DIR, 'index_.html'),
                        path.join(TEMPLATES_DIR, 'playground_.html'),
                    ]);
                });
            },
        },
    ],
};

export default config;
