import { BinaryHeap } from './binary-heap';

describe('binary-heap', () => {
    describe('BinaryHeap', () => {
        it('organize elements by max', () => {
            const heap = new BinaryHeap<number>((a, b) => a > b);

            expect(heap.size()).toEqual(0);
            expect(heap.peek()).toEqual(undefined);

            heap.push(3);
            expect(heap.size()).toEqual(1);
            expect(heap.peek()).toEqual(3);

            heap.push(4);
            expect(heap.size()).toEqual(2);
            expect(heap.peek()).toEqual(4);

            heap.push(8);
            expect(heap.size()).toEqual(3);
            expect(heap.peek()).toEqual(8);

            heap.push(5);
            expect(heap.size()).toEqual(4);
            expect(heap.peek()).toEqual(8);

            heap.push(4);
            expect(heap.size()).toEqual(5);
            expect(heap.peek()).toEqual(8);

            heap.push(11);
            expect(heap.size()).toEqual(6);
            expect(heap.peek()).toEqual(11);

            heap.push(15);
            expect(heap.size()).toEqual(7);
            expect(heap.peek()).toEqual(15);

            expect(heap.pop()).toEqual(15);
            expect(heap.size()).toEqual(6);

            expect(heap.pop()).toEqual(11);
            expect(heap.size()).toEqual(5);

            expect(heap.pop()).toEqual(8);
            expect(heap.size()).toEqual(4);

            expect(heap.pop()).toEqual(5);
            expect(heap.size()).toEqual(3);

            expect(heap.pop()).toEqual(4);
            expect(heap.size()).toEqual(2);

            expect(heap.pop()).toEqual(4);
            expect(heap.size()).toEqual(1);

            expect(heap.pop()).toEqual(3);
            expect(heap.size()).toEqual(0);

            expect(heap.pop()).toEqual(undefined);
            expect(heap.size()).toEqual(0);
        });

        it('organize elements by min', () => {
            const heap = new BinaryHeap<number>((a, b) => a < b);

            heap.push(8);
            expect(heap.size()).toEqual(1);
            expect(heap.peek()).toEqual(8);

            heap.push(5);
            expect(heap.size()).toEqual(2);
            expect(heap.peek()).toEqual(5);

            heap.push(9);
            expect(heap.size()).toEqual(3);
            expect(heap.peek()).toEqual(5);

            heap.push(6);
            expect(heap.size()).toEqual(4);
            expect(heap.peek()).toEqual(5);

            heap.push(3);
            expect(heap.size()).toEqual(5);
            expect(heap.peek()).toEqual(3);

            heap.push(9);
            expect(heap.size()).toEqual(6);
            expect(heap.peek()).toEqual(3);

            heap.push(3);
            expect(heap.size()).toEqual(7);
            expect(heap.peek()).toEqual(3);

            expect(heap.pop()).toEqual(3);
            expect(heap.size()).toEqual(6);

            expect(heap.pop()).toEqual(3);
            expect(heap.size()).toEqual(5);

            expect(heap.pop()).toEqual(5);
            expect(heap.size()).toEqual(4);

            expect(heap.pop()).toEqual(6);
            expect(heap.size()).toEqual(3);

            expect(heap.pop()).toEqual(8);
            expect(heap.size()).toEqual(2);

            expect(heap.pop()).toEqual(9);
            expect(heap.size()).toEqual(1);

            expect(heap.pop()).toEqual(9);
            expect(heap.size()).toEqual(0);

            expect(heap.pop()).toEqual(undefined);
            expect(heap.size()).toEqual(0);
        });

        it('organize by max by default', () => {
            const heap = new BinaryHeap<number>();

            heap.push(3);
            heap.push(2);
            heap.push(5);
            heap.push(4);

            expect([heap.pop(), heap.pop(), heap.pop(), heap.pop()]).toEqual([5, 4, 3, 2]);
        });

        it('clear', () => {
            const heap = new BinaryHeap<number>((a, b) => a > b);

            heap.push(3);
            heap.push(2);
            heap.push(5);
            heap.push(4);

            heap.clear();

            expect(heap.size()).toEqual(0);
        });

        it('remove element', () => {
            const heap = new BinaryHeap<number>((a, b) => a > b);

            heap.push(3);
            heap.push(2);
            heap.push(5);
            heap.push(4);

            expect(heap.remove(4)).toEqual(true);
            expect(heap.remove(4)).toEqual(false);
            expect(heap.peek()).toEqual(5);

            expect(heap.remove(2)).toEqual(true);
            expect(heap.remove(2)).toEqual(false);
            expect(heap.peek()).toEqual(5);

            expect(heap.remove(5)).toEqual(true);
            expect(heap.remove(5)).toEqual(false);
            expect(heap.peek()).toEqual(3);
        });
    });
});
