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
                const value = args[i + 1];
                
                // Handle boolean strings explicitly
                const lowerValue = value.toLowerCase();
                if (lowerValue === 'true') {
                    parsed[flagName] = true;
                } else if (lowerValue === 'false') {
                    parsed[flagName] = false;
                } else {
                    // Try to parse as number
                    const numValue = Number(value);
                    // Only treat as number if it's valid AND the original string looks numeric
                    if (!isNaN(numValue) && value.trim() !== '' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
                        parsed[flagName] = numValue;
                    } else {
                        // Everything else is a string
                        parsed[flagName] = value;
                    }
                }
                i += 2;
            } else {
                // Flag without value
                parsed[flagName] = true;
                i++;
            }
        } else {
            i++;
        }
    }

    return parsed;
}
