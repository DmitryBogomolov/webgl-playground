import { DisposableContext } from './disposable-context';

describe('disposable-context', () => {
    describe('DisposableContext', () => {
        it('dispose collected objects', () => {
            const obj1 = { dispose: jest.fn() };
            const obj2 = { dispose: jest.fn() };
            const obj3 = { dispose: jest.fn() };

            const context = new DisposableContext();
            context.add(obj1);
            context.add(obj2);
            context.add(obj3);
            context.dispose();

            expect(obj1.dispose).toBeCalledWith();
            expect(obj2.dispose).toBeCalledWith();
            expect(obj3.dispose).toBeCalledWith();
        });

        it('do not dispose if released', () => {
            const obj1 = { dispose: jest.fn() };
            const obj2 = { dispose: jest.fn() };
            const obj3 = { dispose: jest.fn() };

            const context = new DisposableContext();
            context.add(obj1);
            context.add(obj2);
            context.add(obj3);
            context.release();
            context.dispose();

            expect(obj1.dispose).not.toBeCalled();
            expect(obj2.dispose).not.toBeCalled();
            expect(obj3.dispose).not.toBeCalled();
        });
    });
});
