import { BackgroundChannel } from './background-channel';

describe('background-channel', () => {
    describe('BackgroundChannel', () => {
        function noop(): void { /* empty */ }

        afterEach(() => {
            jest.resetAllMocks();
        });

        it('pass "self" as carrier', () => {
            const addEventListener = jest.spyOn(self, 'addEventListener').mockImplementation(noop);
            const removeEventListener = jest.spyOn(self, 'removeEventListener').mockImplementation(noop);
            const postMessage = jest.spyOn(self, 'postMessage').mockImplementation(noop);

            const channel = new BackgroundChannel({
                connectionId: 1,
                handler: noop,
            });
            channel.send({ text: 'Hello World' });
            channel.flush();
            channel.dispose();

            expect(addEventListener).toBeCalled();
            expect(removeEventListener).toBeCalled();
            expect(postMessage).toBeCalled();
        });
    });
});
