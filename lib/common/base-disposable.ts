import type { EventProxy } from './event-emitter.types';
import { BaseIdentity } from './base-identity';
import { EventEmitter } from './event-emitter';

export abstract class BaseDisposable extends BaseIdentity {
    private readonly _disposed = new EventEmitter();

    protected _dispose(): void {
        this._disposed.emit();
        this._disposed.clear();
    }

    disposed(): EventProxy {
        return this._disposed.proxy();
    }
}
