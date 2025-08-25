/**
 * Generic CLI argument parser utility
 */

export interface ParsedArgs {
    [key: string]: string | boolean | number | undefined;
}

/**
 * Parse command line arguments into structured format
 * Handles flags (--flag) and key-value pairs (--key value)
 */
export function parseCommandLineArgs(args: string[]): ParsedArgs {
    const parsed: ParsedArgs = {};
    let i = 0; // Start from index 0 since args are already filtered

    while (i < args.length) {
        const arg = args[i];

        if (arg.startsWith('--')) {
            const flagName = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                // Handle numeric values
                const value = args[i + 1];
                const numValue = Number(value);
                parsed[flagName] = !isNaN(numValue) ? numValue : value;
                i += 2;
            } else {
                parsed[flagName] = true;
                i++;
            }
        } else {
            i++;
        }
    }

    return parsed;
}
