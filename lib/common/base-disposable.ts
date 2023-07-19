import type { EventProxy } from './event-emitter.types';
import { BaseIdentity } from './base-identity';
import { EventEmitter } from './event-emitter';

export abstract class BaseDisposable extends BaseIdentity {
    private readonly _disposed = new EventEmitter();

    protected _emitDisposed(): void {
        if (!this._disposed) {
            throw new Error('DEBUG: already disposed');
        }
        this._disposed.emit();
        this._disposed.clear();
        // @ts-ignore DEBUG
        this._disposed = null;
    }

    disposed(): EventProxy {
        return this._disposed.proxy();
    }
}
