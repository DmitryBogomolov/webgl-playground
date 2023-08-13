import { BackgroundChannel } from './background-channel';

describe('background-channel', () => {
    describe('BackgroundChannel', () => {
        function noop(): void { /* empty */ }

        it('pass "self" as carrier', () => {
            let addEventListener: jest.SpyInstance;
            let removeEventListener: jest.SpyInstance;
            let postMessage: jest.SpyInstance;
            try {
                addEventListener = jest.spyOn(self, 'addEventListener').mockImplementation(noop);
                removeEventListener = jest.spyOn(self, 'removeEventListener').mockImplementation(noop);
                postMessage = jest.spyOn(self, 'postMessage').mockImplementation(noop);

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
            } finally {
                addEventListener!.mockReset();
                removeEventListener!.mockReset();
                postMessage!.mockReset();
            }
        });
    });
});
