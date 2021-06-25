import { KDTree, KDTreeSearchItem } from './kd-tree';

describe('kd-tree', () => {
    describe('KDTree', () => {
        interface Point {
            readonly x: number;
            readonly y: number;
        }
        const getX = (point: Point): number => point.x;
        const getY = (point: Point): number => point.y;
        const getDist = (axes: readonly number[]): number => axes[0] * axes[0] + axes[1] * axes[1];
        const getPointDist = (p1: Point, p2: Point): number => getDist([p1.x - p2.x, p1.y - p2.y]);
        const points: Point[] = [
            { x: 1, y: 10 },
            { x: 10, y: 30 },
            { x: 35, y: 90 },
            { x: 50, y: 50 },
            { x: 25, y: 40 },
            { x: 51, y: 75 },
            { x: 60, y: 80 },
            { x: 55, y: 1 },
            { x: 70, y: 70 },
        ];

        it('find nearest point', () => {
            const tree = new KDTree(points, [getX, getY], getDist);

            function check(target: Point, expected: number): void {
                const item: KDTreeSearchItem = {
                    index: expected,
                    distance: getPointDist(target, points[expected]),
                };
                expect(tree.findNearest(target)).toEqual(item);
            }

            // close points
            check({ x: 2, y: 10 }, 0);
            check({ x: 10, y: 31 }, 1);
            check({ x: 34, y: 91 }, 2);
            check({ x: 52, y: 52 }, 3);
            check({ x: 25, y: 40 }, 4);
            check({ x: 50, y: 70 }, 5);
            check({ x: 62, y: 78 }, 6);
            check({ x: 53, y: 5 }, 7);
            check({ x: 75, y: 75 }, 8);

            // corner points
            check({ x: 1, y: 99 }, 2);
            check({ x: 1, y: 1 }, 0);
            check({ x: 99, y: 1 }, 7);
            check({ x: 99, y: 99 }, 8);
        });

        it('find nearest point / empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findNearest({ x: 0, y: 0 })).toEqual(null);
            expect(tree.findNearest({ x: 99, y: 99 })).toEqual(null);
        });

        it('find K nearest points', () => {
            const tree = new KDTree(points, [getX, getY], getDist);

            const target: Point = { x: 52, y: 52 };
            const expected: number[] = [];
            function check(k: number): void {
                const list: KDTreeSearchItem[] = expected.map((idx) => ({
                    index: idx,
                    distance: getPointDist(target, points[idx]),
                }));
                expect(tree.findKNearest(target, k)).toEqual(list);
                for (let i = 1; i < list.length; ++i) {
                    expect(list[i - 1].distance).toBeLessThan(list[i].distance);
                }
            }
            check(0);
            expected.push(3);
            check(1);
            expected.push(5);
            check(2);
            expected.push(8);
            check(3);
            expected.push(6);
            check(4);
            expected.push(4);
            check(5);
            expected.push(2);
            check(6);
            expected.push(1);
            check(7);
            expected.push(7);
            check(8);
            expected.push(0);
            check(9);

            check(10);
            check(100);
        });

        it('find K nearest points / empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findKNearest({ x: 52, y: 52 }, 1)).toEqual([]);
        });

        it('find in radius', () => {
            const tree = new KDTree(points, [getX, getY], getDist);

            const target: Point = { x: 50, y: 50 };
            const expected: number[] = [];
            function check(radius: number): void {
                const list: KDTreeSearchItem[] = expected.map((idx) => ({
                    index: idx,
                    distance: getPointDist(target, points[idx]),
                }));
                expect(tree.findInRadius(target, radius)).toEqual(list);
                for (const item of list) {
                    expect(item.distance).toBeLessThanOrEqual(radius);
                }
                for (let i = 1; i < list.length; ++i) {
                    expect(list[i - 1].distance).toBeLessThan(list[i].distance);
                }
            }

            check(-1);
            expected.push(3);
            check(0);
            check(100);
            expected.push(5);
            check(626);
            check(700);
            expected.push(4);
            check(725);
            expected.push(8, 6);
            check(1200);
            expected.push(2);
            check(1825);
            expected.push(1, 7);
            check(2500);
            expected.push(0);
            check(5000);
            check(10000);
        });

        it('find in radius / empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findInRadius({ x: 50, y: 50 }, 1000)).toEqual([]);
        });
    });
});
