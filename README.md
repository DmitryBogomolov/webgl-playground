[![CI](https://github.com/DmitryBogomolov/webgl-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitryBogomolov/webgl-playground/actions/workflows/ci.yml)

# webgl-playground
Playground for WebGL samples


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
        "NODE_OPTIONS": "--require ts-node/register",
        "TS_NODE_PROJECT": "tsconfig.devserver.json"
    },
    "args": [
        "serve"
    ],
    "program": "${workspaceFolder}/node_modules/.bin/webpack"
},
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
        "context"
    ],
    "program": "${workspaceFolder}/node_modules/.bin/jest"
}
```

### Static content

bootstrap.min.css, bootstrap.min.css.map
TODO: Mention source when these files are updated to a newer version.

leaves.jpg
Downloaded from https://webglfundamentals.org/webgl/resources/leaves.jpg.

play-solid.svg, pause-solid.svg
Downloaded from https://fontawesome.com/search?o=r&c=media-playback&s=solid.


### TODO

- service worker for fetched content (in static bundle)
- rework type system with fields picking
- extract some state object from Runtime - primitive and others would use it rather then entrire Runtime
- uniform buffers

    "@types/jest": "30.0.0",
    "@typescript-eslint/eslint-plugin": "8.57.2",
    "@typescript-eslint/parser": "8.57.2",
    "eslint": "10.1.0",
    "jest": "30.3.0",
    "jest-environment-jsdom": "30.3.0",
    "ts-jest": "29.4.6",
    "ts-loader": "9.5.4",
    "ts-node": "10.9.2",
    "typescript": "6.0.2",
    "webpack-cli": "7.0.2",
    "webpack-dev-server": "5.2.3",
