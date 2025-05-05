declare module 'path-to-regexp' {
    export function pathToRegexp(
        path: string | RegExp | Array<string | RegExp>,
        keys?: any[],
        options?: {
            sensitive?: boolean;
            strict?: boolean;
            end?: boolean;
            start?: boolean;
            delimiter?: string;
            encode?: (value: string) => string;
        }
    ): RegExp;

    export function parse(path: string): Array<string | { name: string | number }>;
    export function compile(path: string): (params?: object) => string;
    export function tokensToRegExp(tokens: Array<any>, keys?: any[], options?: object): RegExp;
    export function tokensToFunction(tokens: Array<any>, options?: object): (params?: object) => string;

    export default pathToRegexp;
} 