[![CI](https://github.com/DmitryBogomolov/webgl-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitryBogomolov/webgl-playground/actions/workflows/ci.yml)

# webgl-playground
Playground for WebGL samples

### Static content

bootstrap.min.css, bootstrap.min.css.map \
TODO: Mention source when these files are updated to a newer version.

leaves.jpg \
[Downloaded here](https://webglfundamentals.org/webgl/resources/leaves.jpg)

play-solid.svg, pause-solid.svg \
[Downloaded here](https://fontawesome.com/search?o=r&c=media-playback&s=solid)


### TODO

- service worker for fetched content (in static bundle)
- rework type system with fields picking
- extract some state object from Runtime - primitive and others would use it rather then entrire Runtime
- uniform buffers

### VSCode launch

```json
{
    "type": "node",
    "request": "launch",
    "name": "dev",
    "skipFiles": [
        "<node_internals>/**",
    ],
    "resolveSourceMapLocations": [
        "${workspaceFolder}/**",
        "!**/node_modules/**"
    ],
    "env": {
        "NODE_OPTIONS": "--require ts-node/register --no-experimental-strip-types",
        "TS_NODE_PROJECT": "./tsconfig.json"
    },
    "args": [
        "serve"
    ],
    "program": "${workspaceFolder}/node_modules/.bin/webpack"
}
```
```json
{
    "type": "node",
    "request": "launch",
    "name": "test",
    "skipFiles": [
        "<node_internals>/**",
    ],
    "resolveSourceMapLocations": [
        "${workspaceFolder}/**",
        "!**/node_modules/**"
    ],
    "args": [
        "--workerThreads",
        "--detectOpenHandles"
        // "test-filter"
    ],
    "program": "${workspaceFolder}/node_modules/.bin/jest"
}
```
