module.exports = {
    process(_sourceText, sourcePath, _options) {
        return `module.exports = 'STUB FOR ${sourcePath}';`;
    }
}
