import { convert, rand } from "../../src";

describe('Converter', () => {
    describe('toSafeString', () => {
        it('does not change the passed in string', () => {
            let actual: string = rand.getString(150, true, false, true, false);
            let expected: string = actual;

            convert.toSafeString(actual);

            expect(actual).toEqual(expected);
        });
    });

    describe('toHoursMinutesSeconds', () => {
        const testData = [
            {mils: 1, expected: '00:00:00.001'},
            {mils: 500, expected: '00:00:00.500'},
            {mils: 1000, expected: '00:00:01.000'},
            {mils: 1500, expected: '00:00:01.500'},
            {mils: 2000, expected: '00:00:02.000'},
            {mils: 60000, expected: '00:01:00.000'},
            {mils: 3600000, expected: '01:00:00.000'},
            {mils: 3666600, expected: '01:01:06.600'},
        ];
        for(var i=0; i<testData.length; i++) {
            let data = testData[i];
            it('can convert milliseconds to string', () => {
                expect(convert.toHoursMinutesSeconds(data.mils)).toEqual(data.expected);
            });
        }
    });

    describe('secToMillisec', () => {
        const testData = [0.5, 1, 10, 60];
        for(var i=0; i<testData.length; i++) {
            const data = testData[i];
            it(`can calculate the milliseconds in '${data}' seconds`, () => {
                expect(convert.secToMillisec(data)).toEqual(data * 1000);
            });
        }
    });

    describe('minToMillisec', () => {
        const testData: Array<{min: number, exp: number}> = [
            {min: 0.5, exp: 30000},
            {min: 1, exp: 60000},
            {min: 2, exp: 120000},
            {min: 60, exp: 3600000}
        ];
        for(var i=0; i<testData.length; i++) {
            const data = testData[i];
            it(`can convert minutes to milliseconds for ${JSON.stringify(data)}`, () => {
                expect(convert.minToMillisec(data.min)).toEqual(data.exp);
            });
        }
    });
});