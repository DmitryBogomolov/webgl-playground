import type { LoaderDefinitionFunction } from 'webpack';

export default <LoaderDefinitionFunction<{ path: string }>> function (source: string): string {
    const { path } = this.getOptions();
    return source.replace('__PATH__', path);
};
