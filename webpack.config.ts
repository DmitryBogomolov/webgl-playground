import path from 'path';
import fs from 'fs';
import { Compiler, Configuration, EntryObject } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssWebpackPlugin from 'mini-css-extract-plugin';
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

const CONTENT_PATH = '/static';
const ASSETS_PATH = '/assets';
const BOOTSTRAP_PATH = `${CONTENT_PATH}/bootstrap.min.css`;
const PLAYGROUND_PATH = '/playground';

const PORT = Number(process.env.PORT) || 3001;

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
        port: PORT,
        publicPath: `${ASSETS_PATH}/`,
        contentBase: path.join(__dirname, './static'),
        contentBasePublicPath: `${CONTENT_PATH}/`,
        index: 'index.html',
        before: (app) => {
            let rootPage = '';
            const playgroundPages = new Map<string, string>();

            watchTemplates((name) => {
                if (name === ROOT_TEMPLATE_NAME) {
                    rootPage = '';
                } else if (name === PLAYGROUND_TEMPLATE_NAME) {
                    playgroundPages.clear();
                } else {
                    playgroundPages.delete(name);
                }
            });

            function getRootPage(): string {
                if (!rootPage) {
                    rootPage = renderRootPage();
                }
                return rootPage;
            }

            function getPlaygroundPage(name: string): string {
                let content = playgroundPages.get(name);
                if (!content) {
                    content = renderPlaygroundPage(name);
                    playgroundPages.set(name, content);
                }
                return content;
            }

            app.get('/', (_req, res) => {
                res.send(getRootPage());
            });
            Object.keys(playgrounds).forEach((name) => {
                app.get(`${PLAYGROUND_PATH}/${name}/`, (_req, res) => {
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
                use: [
                    {
                        loader: MiniCssWebpackPlugin.loader,
                        options: {
                            esModule: true,
                            modules: {
                                // namedExport: true,
                            },
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
                test: /\.(vert|frag)$/,
                use: ['raw-loader'],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssWebpackPlugin(),
        // Without it "[WDS] Nothing changed" (in browser console) is reported when template files are updated.
        // As a result hot reload does not happen and page content is not updated.
        // Somehow "HtmlWebpackPlugin" solves this.
        new HtmlWebpackPlugin(),
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

function renderRootPage(): string {
    return Mustache.render(templates[ROOT_TEMPLATE_NAME]!.content, {
        title: 'WebGL Playground',
        bootstrap_url: BOOTSTRAP_PATH,
        bundle_url: `${ASSETS_PATH}/index.js`,
        styles_url: `${ASSETS_PATH}/index.css`,
        playgrounds: Object.entries(playgrounds).map(
            ([name, { title }]) => ({ url: `${PLAYGROUND_PATH}/${name}/`, title }),
        ),
    });
}

function renderPlaygroundPage(name: string): string {
    const playground = playgrounds[name]!;
    return Mustache.render(templates[PLAYGROUND_TEMPLATE_NAME]!.content, {
        title: playground.title,
        bootstrap_url: BOOTSTRAP_PATH,
        bundle_url: `${ASSETS_PATH}/${name}.js`,
        styles_url: `${ASSETS_PATH}/${name}.css`,
        worker_url: playground.hasWorker ? `${ASSETS_PATH}/${name}_worker.js` : null,
        custom_markup: playground.hasMarkup ? templates[name]!.content : null,
    });
}

function watchTemplates(onChange: (name: string) => void): void {
    Object.entries(templates).forEach(([name, { path }]) => {
        function readTemplate(): void {
            fs.readFile(path, 'utf8', (_err, data) => {
                templates[name]!.content = data;
                onChange(name);
            });
        }
        fs.watch(path, readTemplate);
        readTemplate();
    });
}

export default config;
