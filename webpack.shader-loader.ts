export default function (source: string): string {
    // @ts-ignore
    // const options = this.getOptions();
    console.log('########', source.substring(0, 64));
    return `export default ${JSON.stringify(source)}`;
}
