module.exports = {
    process(_sourceText, sourcePath, _options) {
        return { code: `module.exports = 'STUB FOR ${sourcePath}';` };
    }
}
