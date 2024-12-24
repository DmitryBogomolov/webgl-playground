import { Runtime } from 'lib';

export type TapHandler = (runtime: Runtime) => (() => void);

interface Entry {
    readonly onCreate: TapHandler;
    readonly cache: Map<Runtime, () => void>;
}

const entries: Entry[] = [];

// @ts-ignore Take methods closest to constructor and destructor.
// eslint-disable-next-line @typescript-eslint/unbound-method
const { _getContext, _loseContext } = Runtime.prototype;

// @ts-ignore Hook into constructor.
Runtime.prototype._getContext = function (...args) {
    const ret = _getContext.apply(this, args);
    for (const entry of entries) {
        entry.cache.set(this, entry.onCreate(this));
    }
    return ret;
};
// @ts-ignore Hook into destructor.
Runtime.prototype._loseContext = function (...args) {
    for (const entry of entries) {
        entry.cache.get(this)!();
        entry.cache.delete(this);
    }
    return _loseContext.apply(this, args);
};

export function tapRuntime(handler: TapHandler): () => void {
    const entry: Entry = {
        onCreate: handler,
        cache: new Map(),
    };
    entries.push(entry);
    return () => {
        entries.splice(entries.indexOf(entry), 1);
    };
}

export function setConsoleCommand(name: string, handler: () => void): void {
    // @ts-ignore Global.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const playground = (window.playground = window.playground || {});
    Object.assign(playground, { [name]: handler });
}
