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
    const length = Math.round(finalLength);
    if (length >= 5 && original.length > length) {
        switch (ellipsisLocation) {
            case 'beginning':
                const shortenedStr: string = original.substring((original.length - length) + ellipsis.length);
                return `${ellipsis}${shortenedStr}`;
            case 'middle':
                let beginning = original.substring(0, Math.ceil(length / 2)).split('');
                let end = original.substring(original.length - Math.ceil(length / 2)).split('');
                let removeFromBeginning = true;
                while (beginning.length + ellipsis.length + end.length > length) {
                    if (removeFromBeginning) {
                        beginning.pop();
                        removeFromBeginning = false;
                    } else {
                        end.shift();
                        removeFromBeginning = true;
                    }
                }
                const finalStr = `${beginning.join('')}${ellipsis}${end.join('')}`;
                return finalStr;
            case 'end':
            default:
                const shortStr = original.substring(0, (length - ellipsis.length));
                return `${shortStr}${ellipsis}`;
        }
    }
    return original; // no need to ellide so return original string
};
