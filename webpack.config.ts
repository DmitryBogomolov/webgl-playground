import path from 'path';
import fs from 'fs';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { Compiler, Configuration, EntryObject } from 'webpack';
import Mustache from 'mustache';

interface Playground {
    readonly title: string;
    readonly hasWorker: boolean;
    readonly hasMarkup: boolean;
}

interface Template {
    readonly path: string;
    content: string;
}

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PLAYGROUND_DIR = path.join(__dirname, 'playground');

const ROOT_TEMPLATE_NAME = 'index';
const PLAYGROUND_TEMPLATE_NAME = 'playground';

const templates: Record<string, Template> = {};
templates[ROOT_TEMPLATE_NAME] = { path: path.join(TEMPLATES_DIR, 'index.html'), content: '' };
templates[PLAYGROUND_TEMPLATE_NAME] = { path: path.join(TEMPLATES_DIR, 'playground.html'), content: '' };

function capitalizeWord(word: string): string {
    return word[0].toUpperCase() + word.slice(1);
}

function capitalizeName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\w\S*/g, capitalizeWord);
}

const playgrounds: Record<string, Playground> = {};
fs.readdirSync(PLAYGROUND_DIR).forEach((dirName) => {
    const currentDir = path.join(PLAYGROUND_DIR, dirName);
    if (fs.existsSync(path.join(currentDir, 'index.ts'))) {
        const markupPath = path.join(currentDir, 'markup.html');
        const hasMarkup = fs.existsSync(markupPath);
        playgrounds[dirName] = {
            title: capitalizeName(dirName),
            hasWorker: fs.existsSync(path.join(currentDir, 'worker.ts')),
            hasMarkup,
        };
        if (hasMarkup) {
            templates[dirName] = { path: markupPath, content: '' };
        }
    }
});

const entry: EntryObject = {
    'index': path.join(TEMPLATES_DIR, 'index.ts'),
};

Object.entries(playgrounds).forEach(([name, playground]) => {
    entry[name] = path.join(PLAYGROUND_DIR, name, 'index.ts');
    if (playground.hasWorker) {
        entry[name + '_worker'] = path.join(PLAYGROUND_DIR, name, 'worker.ts');
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
        before: (app) => {
            let rootPage = '';
            const playgroundPages = new Map<string, string>();

            Object.entries(templates).forEach(([name, { path }]) => {
                function readTemplate(): void {
                    fs.readFile(path, 'utf8', (_err, data) => {
                        templates[name]!.content = data;
                        // Simple depedencies.
                        if (name === ROOT_TEMPLATE_NAME) {
                            rootPage = '';
                        } else if (name === PLAYGROUND_TEMPLATE_NAME) {
                            playgroundPages.clear();
                        } else {
                            playgroundPages.delete(name);
                        }
                    });
                }
                fs.watch(path, readTemplate);
                readTemplate();
            });

            function getRootPage(): string {
                if (!rootPage) {
                    rootPage = Mustache.render(templates[ROOT_TEMPLATE_NAME]!.content, {
                        title: 'WebGL Playground',
                        bootstrap_url: '/static/bootstrap.min.css',
                        bundle_url: '/assets/index.js',
                        playgrounds: Object.entries(playgrounds).map(([name, { title }]) => ({ url: `/playground/${name}/`, title })),
                    });
                }
                return rootPage;
            }

            function getPlaygroundPage(name: string): string {
                let content = playgroundPages.get(name);
                if (!content) {
                    const playground = playgrounds[name]!;
                    content = Mustache.render(templates[PLAYGROUND_TEMPLATE_NAME]!.content, {
                        title: playground.title,
                        bootstrap_url: '/static/bootstrap.min.css',
                        bundle_url: `/assets/${name}.js`,
                        worker_url: playground.hasWorker ? `/assets/${name}_worker.js` : null,
                        custom_markup: playground.hasMarkup ? templates[name]!.content : null,
                    });
                    playgroundPages.set(name, content);
                }
                return content;
            }

            app.get('/', (_req, res) => {
                res.send(getRootPage());
            });
            Object.keys(playgrounds).forEach((name) => {
                app.get(`/playground/${name}/`, (_req, res) => {
                    res.send(getPlaygroundPage(name));
                });
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
        {
            apply(compiler: Compiler): void {
                compiler.hooks.afterCompile.tap('watch-templates', (compilation) => {
                    Object.values(templates).forEach(({ path }) => {
                        compilation.fileDependencies.add(path);
                    });
                });
            },
        },
    ],
};

export default config;
