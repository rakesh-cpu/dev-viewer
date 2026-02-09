/**
 * Advanced JSON Repair Algorithm
 * Uses token-based parsing and state machine to intelligently fix JSON
 */
class JSONRepair {
    constructor() {
        this.repairs = [];
    }

    /**
     * Main repair function
     */
    repair(jsonString) {
        this.repairs = [];
        let repaired = jsonString;

        // Step 1: Fix common patterns
        repaired = this.fixCommonPatterns(repaired);

        // Step 2: Try to parse and fix structural errors
        repaired = this.fixStructuralErrors(repaired);

        return {
            repaired,
            repairs: this.repairs
        };
    }

    /**
     * Fix common patterns like [Object], [[Object]], etc.
     */
    fixCommonPatterns(str) {
        let result = str;

        // Replace [Object] with {}
        const objectMatches = result.match(/\[Object\]/g);
        if (objectMatches) {
            result = result.replace(/\[Object\]/g, '{}');
            this.repairs.push(`Replaced ${objectMatches.length} instance(s) of [Object] with {}`);
        }

        // Replace [[Object]] with [{}]
        const arrayObjectMatches = result.match(/\[\[Object\]\]/g);
        if (arrayObjectMatches) {
            result = result.replace(/\[\[Object\]\]/g, '[{}]');
            this.repairs.push(`Replaced ${arrayObjectMatches.length} instance(s) of [[Object]] with [{}]`);
        }

        // Replace "Object" with {}
        const quotedObjectMatches = result.match(/"Object"/g);
        if (quotedObjectMatches) {
            result = result.replace(/"Object"/g, '{}');
            this.repairs.push(`Replaced ${quotedObjectMatches.length} instance(s) of "Object" with {}`);
        }

        // Remove trailing commas
        const trailingCommaMatches = result.match(/,(\s*[\]}])/g);
        if (trailingCommaMatches) {
            result = result.replace(/,(\s*[\]}])/g, '$1');
            this.repairs.push(`Removed ${trailingCommaMatches.length} trailing comma(s)`);
        }

        return result;
    }

    /**
     * Advanced structural error fixing using state machine
     */
    fixStructuralErrors(str) {
        let result = str;
        let maxIterations = 10; // Prevent infinite loops
        let iteration = 0;

        while (iteration < maxIterations) {
            try {
                JSON.parse(result);
                // If parsing succeeds, we're done
                break;
            } catch (e) {
                const errorInfo = this.parseError(e.message);
                if (!errorInfo) break;

                const fix = this.attemptFix(result, errorInfo);
                if (!fix.fixed) break;

                result = fix.result;
                this.repairs.push(fix.message);
                iteration++;
            }
        }

        return result;
    }

    /**
     * Parse error message to extract position and type
     */
    parseError(errorMessage) {
        // Match: "Unexpected token X in JSON at position Y"
        const posMatch = errorMessage.match(/position (\d+)/);
        
        // Match: "Expected ',' or '}' after property value"
        const expectedMatch = errorMessage.match(/Expected '(.+?)'/);
        
        if (posMatch) {
            return {
                position: parseInt(posMatch[1]),
                expected: expectedMatch ? expectedMatch[1] : null,
                message: errorMessage
            };
        }

        return null;
    }

    /**
     * Attempt to fix the JSON based on error information
     */
    attemptFix(str, errorInfo) {
        const pos = errorInfo.position;
        const char = str[pos];
        const context = this.getContext(str, pos);

        // Strategy 1: Missing colon after property name
        if (errorInfo.message.includes("Expected ':'") || 
            errorInfo.message.includes("after property name")) {
            const before = str.substring(0, pos);
            const after = str.substring(pos);
            
            // Insert colon
            return {
                fixed: true,
                result: before + ':' + after,
                message: `Added missing ':' at position ${pos}`
            };
        }

        // Strategy 2: Missing comma between properties
        if (errorInfo.message.includes("Expected ','") || 
            errorInfo.message.includes("after property value")) {
            const before = str.substring(0, pos);
            const after = str.substring(pos);
            
            // Insert comma
            return {
                fixed: true,
                result: before + ',' + after,
                message: `Added missing ',' at position ${pos}`
            };
        }

        // Strategy 3: Unexpected token - might need to remove or replace
        if (errorInfo.message.includes("Unexpected token")) {
            // Check if it's a duplicate character
            if (pos > 0 && str[pos - 1] === char) {
                // Remove duplicate
                return {
                    fixed: true,
                    result: str.substring(0, pos) + str.substring(pos + 1),
                    message: `Removed duplicate '${char}' at position ${pos}`
                };
            }
        }

        // Strategy 4: Unescaped quotes in strings
        if (char === '"' && context.inString) {
            const before = str.substring(0, pos);
            const after = str.substring(pos + 1);
            return {
                fixed: true,
                result: before + '\\"' + after,
                message: `Escaped quote at position ${pos}`
            };
        }

        return { fixed: false };
    }

    /**
     * Get context around a position (are we in a string, object, array?)
     */
    getContext(str, pos) {
        let inString = false;
        let inObject = 0;
        let inArray = 0;
        let escaped = false;

        for (let i = 0; i < pos; i++) {
            const char = str[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
            } else if (!inString) {
                if (char === '{') inObject++;
                else if (char === '}') inObject--;
                else if (char === '[') inArray++;
                else if (char === ']') inArray--;
            }
        }

        return {
            inString,
            inObject: inObject > 0,
            inArray: inArray > 0,
            depth: inObject + inArray
        };
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONRepair;
}
