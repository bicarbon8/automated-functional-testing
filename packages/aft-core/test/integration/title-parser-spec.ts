import { TitleParser } from '../../src';

describe('TitleParser', () => {
    const tcdata = [
        {title: '', expected: []},
        {title: '[C1234]', expected: ['C1234']},
        {title: 'foo [C1234]', expected: ['C1234']},
        {title: '[C1234] foo', expected: ['C1234']},
        {title: 'foo [C1234] foo', expected: ['C1234']},
        {title: '[C1234] [C2345]', expected: ['C1234', 'C2345']},
        {title: 'foo [C1234] [C2345]', expected: ['C1234', 'C2345']},
        {title: '[C1234] foo [C2345]', expected: ['C1234', 'C2345']},
        {title: '[C1234] [C2345] foo', expected: ['C1234', 'C2345']},
        {title: 'foo [C1234] foo [C2345] foo', expected: ['C1234', 'C2345']},
        {title: 'foo[C1234] foo[C2345]', expected: ['C1234', 'C2345']},
        {title: 'foo[C1234][C2345]', expected: ['C1234', 'C2345']},
        {title: '[C1234]foo [C2345]foo', expected: ['C1234', 'C2345']},
        {title: 'Case name 1234', expected: []},
        {title: 'foo [C1234] bar <BUG-123> baz', expected: ['C1234']}
    ];
    tcdata.forEach((d) => {
        it(`can parse cases from titles: '${d.title}'`, function () {
            expect(TitleParser.parseTestIds(d.title)).toEqual(d.expected);
        });
    });
});