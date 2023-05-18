import { test, expect } from "@jest/globals";
import { TitleParser } from '../src/title-parser';

describe('TitleParser', () => {
    test.each([
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
    ])(`can parse cases from titles`, (data) => {
        expect(TitleParser.parseTestIds(data.title)).toEqual(data.expected);
    });
});