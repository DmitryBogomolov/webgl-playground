import { KDTree } from './kd-tree';

describe('kd-tree', () => {
    describe('KDTree', () => {
        interface Point {
            readonly x: number;
            readonly y: number;
        }
        const getX = (point: Point): number => point.x;
        const getY = (point: Point): number => point.y;
        const getDist = (diff: readonly number[]): number => diff[0] * diff[0] + diff[1] * diff[1];

        it('find nearest point', () => {
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

        it('find nothing in empty tree', () => {
            const tree = new KDTree([], [getX, getY], getDist);

            expect(tree.findNearest({ x: 0, y: 0 })).toEqual(null);
            expect(tree.findNearest({ x: 99, y: 99 })).toEqual(null);
        });
    });
});
