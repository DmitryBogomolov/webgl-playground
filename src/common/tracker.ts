import type { TrackerEvent, TrackerEventProxy, TRACKER_EVENTS } from './tracker.types';
import { getEventCoords } from '../utils/pointer-event';
import { EventEmitter } from './event-emitter';

export class Tracker {
    private readonly _element: HTMLElement;
    private readonly _emitters = createEmitters();

    constructor(element: HTMLElement) {
        this._element = element;
        this._addElementListeners();
    }

    dispose(): void {
        for (const emitter of Object.values(this._emitters)) {
            emitter.clear();
        }
        this._removeElementListeners();
        this._removeDocumentListeners();
    }

    event(name: TRACKER_EVENTS): TrackerEventProxy {
        return this._emitters[name].proxy();
    }

    private _emit(name: TRACKER_EVENTS, event: TrackerEvent): void {
        this._emitters[name].emit(event);
    }

    private readonly _handlePointerDown = (e: PointerEvent): void => {
        this._addDocumentListeners();
        e.preventDefault();
        const coords = getEventCoords(e);
        this._emit('start', { coords, nativeEvent: e });
    };

    private readonly _handlePointerMove = (e: PointerEvent): void => {
        const coords = getEventCoords(e);
        this._emit('move', { coords, nativeEvent: e });
    };

    private readonly _handlePointerUp = (e: PointerEvent): void => {
        this._removeDocumentListeners();
        const coords = getEventCoords(e);
        this._emit('end', { coords, nativeEvent: e });
    };

    private readonly _handleHover = (e: PointerEvent): void => {
        e.preventDefault();
        const coords = getEventCoords(e);
        this._emit('hover', { coords, nativeEvent: e });
    };

    private readonly _handleClick = (e: MouseEvent): void => {
        e.preventDefault();
        const coords = getEventCoords(e);
        this._emit('click', { coords, nativeEvent: e });
    };

    private readonly _handleDblClick = (e: MouseEvent): void => {
        e.preventDefault();
        const coords = getEventCoords(e);
        this._emit('dblclick', { coords, nativeEvent: e });
    };

    private _addElementListeners(): void {
        this._element.addEventListener('contextmenu', preventDefault);
        this._element.addEventListener('pointerdown', this._handlePointerDown);
        this._element.addEventListener('pointermove', this._handleHover);
        this._element.addEventListener('click', this._handleClick);
        this._element.addEventListener('dblclick', this._handleDblClick);
    }

    private _removeElementListeners(): void {
        this._element.removeEventListener('contextmenu', preventDefault);
        this._element.removeEventListener('pointerdown', this._handlePointerDown);
        this._element.removeEventListener('pointermove', this._handleHover);
        this._element.removeEventListener('click', this._handleClick);
        this._element.removeEventListener('dblclick', this._handleDblClick);
    }

    private _addDocumentListeners(): void {
        document.addEventListener('pointermove', this._handlePointerMove);
        document.addEventListener('pointerup', this._handlePointerUp);
        document.addEventListener('pointercancel', this._handlePointerUp);
    }

    private _removeDocumentListeners(): void {
        document.removeEventListener('pointermove', this._handlePointerMove);
        document.removeEventListener('pointerup', this._handlePointerUp);
        document.removeEventListener('pointercancel', this._handlePointerUp);
    }
}

function createEmitters(): Record<TRACKER_EVENTS, EventEmitter<[TrackerEvent]>> {
    return {
        click: new EventEmitter(),
        dblclick: new EventEmitter(),
        hover: new EventEmitter(),
        start: new EventEmitter(),
        move: new EventEmitter(),
        end: new EventEmitter(),
    };
}

function preventDefault(e: Event): void {
    e.preventDefault();
}
