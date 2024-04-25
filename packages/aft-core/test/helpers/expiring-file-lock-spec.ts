import { AftConfig, ExpiringFileLock, convert, rand, wait } from "../../src"

describe('ExpiringFileLock', () => {
    it('can lock a file', () => {
        const file = rand.getString(15, true);
        let now: number;
        let efl: ExpiringFileLock;
        let blocked: ExpiringFileLock;
        try {
            now = Date.now();
            efl = new ExpiringFileLock(file, new AftConfig({
                fileLockMaxHold: 5000,
                fileLockMaxWait: 1000
            }));

            expect(efl.lockDuration).toEqual(5000);
            expect(efl.lockName).toContain(file);
            expect(convert.toElapsedMs(now)).toBeLessThan(1000);

            try {
                blocked = new ExpiringFileLock(file, new AftConfig({
                    fileLockMaxHold: 5000,
                    fileLockMaxWait: 10
                }));

                expect(false).toBeTrue(); // force failure if here
            } catch (e) {
                expect(e.message).toContain('unable to acquire lock on');
                expect(e.message).toContain(file);
                expect(e.message).toContain(`within '${10}ms'`);
            } finally {
                blocked?.unlock();
            }
        } finally {
            efl?.unlock();
        }
    })

    it('automatically expires the lock after a set amount of time', async () => {
        const file = rand.getString(15, true);
        let now: number;
        let efl: ExpiringFileLock;
        let acquiredAfterWait: ExpiringFileLock;
        try {
            now = Date.now();
            efl = new ExpiringFileLock(file, new AftConfig({
                fileLockMaxHold: 50,
                fileLockMaxWait: 1000
            }));

            expect(efl.lockDuration).toEqual(50);
            expect(efl.lockName).toContain(file);
            expect(convert.toElapsedMs(now)).toBeLessThan(1000);

            await wait.forDuration(500);

            try {
                acquiredAfterWait = new ExpiringFileLock(file, new AftConfig({
                    fileLockMaxHold: 5000,
                    fileLockMaxWait: 1000
                }));

                expect(acquiredAfterWait.lockDuration).toEqual(5000);
                expect(convert.toElapsedMs(now)).toBeLessThan(1000);
            } finally {
                acquiredAfterWait?.unlock();
            }
        } finally {
            efl?.unlock();
        }
    })
})
