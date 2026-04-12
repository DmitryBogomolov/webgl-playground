import type { LoaderDefinitionFunction } from 'webpack';

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default <LoaderDefinitionFunction<{ path: string }>> function (source: string): string {
    const { path } = this.getOptions();
    return source.replace('__PATH__', path);
};
