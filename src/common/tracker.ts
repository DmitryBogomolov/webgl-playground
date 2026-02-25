import type { TrackerEvent, TRACKER_EVENTS, TrackerHandlers } from './tracker.types';
import type { Vec2Mut } from '../geometry/vec2.types';
import { vec2, clone2, sqrdist2 } from '../geometry/vec2';
import { getEventCoords } from '../utils/pointer-event';

const CLICK_DURATION = 120;
const CLICK_DISTANCE = 5 * 5 * 2;
const DBL_CLICK_INTERVAL = 200;

export class Tracker {
    private readonly _element: HTMLElement;
    private readonly _handlers: TrackerHandlers;
    private _clickCoords = vec2(NaN, NaN);
    private _clickTimestamp = 0;
    private _dblClickCounter = 0;
    private _dblClickTimestamp = 0;

    constructor(element: HTMLElement, handlers: TrackerHandlers) {
        this._element = element;
        this._handlers = handlers;
        this._addElementListeners();
    }

    dispose(): void {
        this._removeElementListeners();
        this._removeDocumentListeners();
    }

    private _emit(name: TRACKER_EVENTS, event: TrackerEvent): void {
        this._handlers[name]?.(event);
    }

    private readonly _handlePointerDown = (e: PointerEvent): void => {
        this._addDocumentListeners();
        e.preventDefault();
        const ev = this._makeEvent(e);
        const timestamp = now();
        this._clickCoords = clone2(ev.coords);
        this._clickTimestamp = timestamp;
        if (timestamp - this._dblClickTimestamp > DBL_CLICK_INTERVAL) {
            this._dblClickTimestamp = timestamp;
            this._dblClickCounter = 0;
        }
        this._emit('start', ev);
    };

    private readonly _handlePointerMove = (e: PointerEvent): void => {
        this._emit('move', this._makeEvent(e));
    };

    private readonly _handlePointerUp = (e: PointerEvent): void => {
        this._removeDocumentListeners();
        const ev = this._makeEvent(e);
        const timestamp = now();
        this._emit('end', ev);
        if (
            timestamp - this._clickTimestamp <= CLICK_DURATION &&
            sqrdist2(ev.coords, this._clickCoords) <= CLICK_DISTANCE
        ) {
            this._emit('click', ev);
            ++this._dblClickCounter;
        }
        if (this._dblClickCounter === 2) {
            this._emit('dblclick', ev);
            this._dblClickTimestamp = 0;
        }
    };

    private readonly _handleHover = (e: PointerEvent): void => {
        e.preventDefault();
        this._emit('hover', this._makeEvent(e));
    };

    private _addElementListeners(): void {
        this._element.addEventListener('contextmenu', preventDefault);
        this._element.addEventListener('pointerdown', this._handlePointerDown);
        this._element.addEventListener('pointermove', this._handleHover);
    }

    private _removeElementListeners(): void {
        this._element.removeEventListener('contextmenu', preventDefault);
        this._element.removeEventListener('pointerdown', this._handlePointerDown);
        this._element.removeEventListener('pointermove', this._handleHover);
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

    private _makeEvent(e: MouseEvent | PointerEvent): TrackerEvent {
        getEventCoords(e, this._element, _event_scratch.coords);
        _event_scratch.nativeEvent = e;
        return _event_scratch;
    }
}

const _event_scratch = { coords: vec2(0, 0) as Vec2Mut, nativeEvent: {} as PointerEvent | MouseEvent };

function now(): number {
    return Date.now();
}

function preventDefault(e: Event): void {
    e.preventDefault();
}
