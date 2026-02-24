import type { TrackerEvent, TRACKER_EVENTS, TrackerHandlers } from './tracker.types';
import type { Vec2Mut } from '../geometry/vec2.types';
import { vec2 } from '../geometry/vec2';
import { getEventCoords } from '../utils/pointer-event';

export class Tracker {
    private readonly _element: HTMLElement;
    private readonly _handlers: TrackerHandlers;

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
        this._emit('start', this._makeEvent(e));
    };

    private readonly _handlePointerMove = (e: PointerEvent): void => {
        this._emit('move', this._makeEvent(e));
    };

    private readonly _handlePointerUp = (e: PointerEvent): void => {
        this._removeDocumentListeners();
        this._emit('end', this._makeEvent(e));
    };

    private readonly _handleHover = (e: PointerEvent): void => {
        e.preventDefault();
        this._emit('hover', this._makeEvent(e));
    };

    private readonly _handleClick = (e: MouseEvent): void => {
        e.preventDefault();
        this._emit('click', this._makeEvent(e));
    };

    private readonly _handleDblClick = (e: MouseEvent): void => {
        e.preventDefault();
        this._emit('dblclick', this._makeEvent(e));
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

    private _makeEvent(e: MouseEvent | PointerEvent): TrackerEvent {
        getEventCoords(e, this._element, _event_scratch.coords);
        _event_scratch.nativeEvent = e;
        return _event_scratch;
    }
}

const _event_scratch = { coords: vec2(0, 0) as Vec2Mut, nativeEvent: {} as PointerEvent | MouseEvent };

function preventDefault(e: Event): void {
    e.preventDefault();
}
