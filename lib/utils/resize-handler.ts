import { CancelSubscriptionCallback } from './cancel-subscription-callback';
import { throttle } from './throttler';

export function handleWindowResize(callback: () => void, timespan: number = 250): CancelSubscriptionCallback {
    const listener = throttle(callback, timespan);
    window.addEventListener('resize', listener);
    return () => {
        window.removeEventListener('resize', listener);
    };
}
