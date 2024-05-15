export type EllipsisLocation = 'beginning' | 'middle' | 'end';

/**
 * truncates the passed in string if its length exceeds the length specified by
 * `finalLength` and adds an `ellipsis` at the point of truncation
 * 
 * ex:
 * ```typescript
 * const original = 'the quick brown fox jumped over the lazy dogs';
 * ellide(original, 10);              // 'the qui...'
 * ellide(original, 10, 'beginning'); // '...zy dogs'
 * ellide(original, 10, 'middle');    // 'the...dogs'
 * ellide(original, 10, 'end', '_');  // 'the quick_'
 * ```
 * @param original the original string to be ellided if over the specified `finalLength`
 * @param finalLength the maximum length the output string can be (including ellipsis)
 * @param ellipsisLocation a value of `beginning`, `middle`, or `end` indicating where
 * the ellipsis will be added and what part of the input string will be truncated
 * @default end
 * @param ellipsis the value to use as the ellipsis @default '...'
 * @returns if the `original` string is over the length specified by `finalLength` then
 * a truncated string will be returned with the `ellipsis` character(s) at the location
 * of the truncation as specified by the `ellipsisLocation`
 */
export const ellide = function(original: string, finalLength: number, ellipsisLocation: EllipsisLocation = 'end', ellipsis: string = '...'): string {
    if (finalLength >= 5 && original.length > finalLength) {
        switch (ellipsisLocation) {
            case 'beginning':
                const shortenedStr: string = original.substring((original.length - finalLength) + ellipsis.length);
                return `${ellipsis}${shortenedStr}`;
            case 'middle':
                const beginningStr: string = original.substring(0, original.length / 2);
                const endStr: string = original.substring(original.length / 2);
                let shortenedBeginningStr: string = ellide(beginningStr, (finalLength / 2) - (ellipsis.length / 2), 'end', '');
                let shortenedEndStr: string = ellide(endStr, (finalLength / 2) - (ellipsis.length / 2), 'beginning', ''); 
                let removeFromBeginning = true;
                while (shortenedBeginningStr.length + ellipsis.length + shortenedEndStr.length > finalLength) {
                    if (removeFromBeginning) {
                        shortenedBeginningStr = shortenedBeginningStr.substring(0, shortenedBeginningStr.length - 2);
                        removeFromBeginning = false;
                    } else {
                        shortenedEndStr = shortenedEndStr.substring(1, shortenedEndStr.length - 1);
                        removeFromBeginning = true;
                    }
                }
                const finalStr = `${shortenedBeginningStr}${ellipsis}${shortenedEndStr}`;
                return finalStr;
            case 'end':
            default:
                const shortStr = original.substring(0, (finalLength - ellipsis.length));
                return `${shortStr}${ellipsis}`;
        }
    }
    return original; // no need to ellide so return original string
};
