[![CircleCI](https://circleci.com/gh/DmitryBogomolov/webgl-playground.svg?style=svg)](https://circleci.com/gh/DmitryBogomolov/webgl-playground)

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
