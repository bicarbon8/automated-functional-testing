export class TitleParser {
    /**
     * parses TestIds from the passed in title. a TestId
     * must be surrounded by square brackets and should take
     * the form of:
     * `some test [ID123] with multiple ids [Another]` where
     * `['ID123', 'Another']` would be returned
     * @param title the test full title to be parsed
     * @returns an array of TestId strings or empty array
     */
    static parseTestIds(title: string): Array<string> {
        return this._parseAll(title, /\[([^\[\]]+)\]/gi);
    }

    private static _parseAll(input: string, regex: RegExp): Array<string> {
        const results = new Array<string>();
        const allMatches = [...input.matchAll(regex)];
        for (const matches of allMatches) {
            matches?.forEach((match, groupIndex) => {
                if (groupIndex > 0) {
                    results.push(match);
                }
            });
        }
        return results;
    }
}
