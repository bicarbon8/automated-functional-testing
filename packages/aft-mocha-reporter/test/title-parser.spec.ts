import * as chai from 'chai';
import { TitleParser } from '../src/title-parser';
const expect = chai.expect;

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
            expect(TitleParser.parseTestIds(d.title)).to.eql(d.expected);
        });
    });

    const ddata = [
        {title: '', expected: []},
        {title: '<BUG-123>', expected: ['BUG-123']},
        {title: 'foo <BUG-123>', expected: ['BUG-123']},
        {title: '<BUG-123> foo', expected: ['BUG-123']},
        {title: 'foo <BUG-123> foo', expected: ['BUG-123']},
        {title: '<BUG-123> <BUG-234>', expected: ['BUG-123', 'BUG-234']},
        {title: 'foo <BUG-123> <BUG-234>', expected: ['BUG-123', 'BUG-234']},
        {title: '<BUG-123> foo <BUG-234>', expected: ['BUG-123', 'BUG-234']},
        {title: '<BUG-123> <BUG-234> foo', expected: ['BUG-123', 'BUG-234']},
        {title: 'foo <BUG-123> foo <BUG-234> foo', expected: ['BUG-123', 'BUG-234']},
        {title: 'foo<BUG-123> foo<BUG-234>', expected: ['BUG-123', 'BUG-234']},
        {title: 'foo<BUG-123><BUG-234>', expected: ['BUG-123', 'BUG-234']},
        {title: '<BUG-123>foo <BUG-234>foo', expected: ['BUG-123', 'BUG-234']},
        {title: 'Bug name 123', expected: []},
        {title: 'foo [C1234] bar <BUG-123> baz', expected: ['BUG-123']}
    ];
    ddata.forEach((d) => {
        it(`can parse defects from titles: '${d.title}'`, function () {
            expect(TitleParser.parseDefectIds(d.title)).to.eql(d.expected);
        });
    });
});