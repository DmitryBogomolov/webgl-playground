import { KDTree } from './kd-tree';

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

            function check(target: Point, expected: Point): void {
                expect(tree.findNearest(target)).toEqual(expected);
            }

            // close points
            check({ x: 2, y: 10 }, points[0]);
            check({ x: 10, y: 31 }, points[1]);
            check({ x: 34, y: 91 }, points[2]);
            check({ x: 52, y: 52 }, points[3]);
            check({ x: 25, y: 40 }, points[4]);
            check({ x: 50, y: 70 }, points[5]);
            check({ x: 62, y: 78 }, points[6]);
            check({ x: 53, y: 5 }, points[7]);
            check({ x: 75, y: 75 }, points[8]);

            // corner points
            check({ x: 1, y: 99 }, points[2]);
            check({ x: 1, y: 1 }, points[0]);
            check({ x: 99, y: 1 }, points[7]);
            check({ x: 99, y: 99 }, points[8]);
        });

        it('find nearest point / empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findNearest({ x: 0, y: 0 })).toEqual(null);
            expect(tree.findNearest({ x: 99, y: 99 })).toEqual(null);
        });

        it('find K nearest points', () => {
            const tree = new KDTree(points, [getX, getY], getDist);

            const target: Point = { x: 52, y: 52 };
            const expected: Point[] = [];
            function check(k: number): void {
                expect(tree.findKNearest(target, k)).toEqual(expected);
                for (let i = 1; i < expected.length; ++i) {
                    const d1 = getPointDist(target, expected[i - 1]);
                    const d2 = getPointDist(target, expected[i - 0]);
                    expect(d1).toBeLessThan(d2);
                }
            }
            check(0);
            expected.push(points[3]);
            check(1);
            expected.push(points[5]);
            check(2);
            expected.push(points[8]);
            check(3);
            expected.push(points[6]);
            check(4);
            expected.push(points[4]);
            check(5);
            expected.push(points[2]);
            check(6);
            expected.push(points[1]);
            check(7);
            expected.push(points[7]);
            check(8);
            expected.push(points[0]);
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
            const expected: Point[] = [];
            function check(radius: number): void {
                expect(tree.findInRadius(target, radius)).toEqual(expected);
                for (const p of expected) {
                    const d = getPointDist(target, p);
                    expect(d).toBeLessThanOrEqual(radius);
                }
                for (let i = 1; i < expected.length; ++i) {
                    const d1 = getPointDist(target, expected[i - 1]);
                    const d2 = getPointDist(target, expected[i - 0]);
                    expect(d1).toBeLessThan(d2);
                }
            }

            check(-1);
            expected.push(points[3]);
            check(0);
            check(100);
            expected.push(points[5]);
            check(626);
            check(700);
            expected.push(points[4]);
            check(725);
            expected.push(points[8], points[6]);
            check(1200);
            expected.push(points[2]);
            check(1825);
            expected.push(points[1], points[7]);
            check(2500);
            expected.push(points[0])
            check(5000);
            check(10000);
        });

        it('find in radius / empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findInRadius({ x: 50, y: 50 }, 1000)).toEqual([]);
        });
    });
});
