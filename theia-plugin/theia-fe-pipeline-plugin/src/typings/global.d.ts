// import { DvaInstance } from 'dva';

declare global {
    export interface URI {

    }

    export interface TextSearchPreviewOptions {
        /**
         * The maximum number of lines in the preview.
         * Only search providers that support multiline search will ever return more than one line in the match.
         */
        matchLines: number;

        /**
         * The maximum number of characters included per line.
         */
        charsPerLine: number;
    }
}

export { };
