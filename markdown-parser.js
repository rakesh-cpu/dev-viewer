/**
 * Markdown Parser - Pure JavaScript Implementation
 * Converts markdown syntax to HTML without external libraries
 */

class MarkdownParser {
    constructor() {
        // Regular expressions for markdown patterns
        this.patterns = {
            // Headers
            h6: /^######\s+(.+)$/gm,
            h5: /^#####\s+(.+)$/gm,
            h4: /^####\s+(.+)$/gm,
            h3: /^###\s+(.+)$/gm,
            h2: /^##\s+(.+)$/gm,
            h1: /^#\s+(.+)$/gm,
            
            // Horizontal rule
            hr: /^(\*\*\*|---|___)$/gm,
            
            // Code blocks (fenced with backticks)
            codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
            
            // Blockquotes
            blockquote: /^>\s+(.+)$/gm,
            
            // Lists
            unorderedList: /^[\*\-\+]\s+(.+)$/gm,
            orderedList: /^\d+\.\s+(.+)$/gm,
            
            // Inline styles
            bold: /\*\*(.+?)\*\*/g,
            italic: /\*(.+?)\*/g,
            boldAlt: /__(.+?)__/g,
            italicAlt: /_(.+?)_/g,
            strikethrough: /~~(.+?)~~/g,
            
            // Links and images
            image: /!\[([^\]]*)\]\(([^\)]+)\)/g,
            link: /\[([^\]]+)\]\(([^\)]+)\)/g,
            
            // Inline code
            inlineCode: /`([^`]+)`/g,
            
            // Line breaks
            lineBreak: /  $/gm,
        };
    }

    /**
     * Main parse method - converts markdown to HTML
     * @param {string} markdown - Raw markdown text
     * @returns {string} - HTML output
     */
    parse(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        let html = markdown;

        // Escape HTML to prevent XSS
        html = this.escapeHtml(html);

        // Parse code blocks first (to protect them from other transformations)
        html = this.parseCodeBlocks(html);

        // Parse block-level elements
        html = this.parseHeaders(html);
        html = this.parseHorizontalRules(html);
        html = this.parseBlockquotes(html);
        html = this.parseLists(html);

        // Parse inline elements
        html = this.parseImages(html);
        html = this.parseLinks(html);
        html = this.parseInlineCode(html);
        html = this.parseBold(html);
        html = this.parseItalic(html);
        html = this.parseStrikethrough(html);

        // Parse paragraphs (must be last)
        html = this.parseParagraphs(html);

        // Restore code blocks
        html = this.restoreCodeBlocks(html);

        return html;
    }

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Store code blocks temporarily to protect them
     */
    parseCodeBlocks(text) {
        this.codeBlocks = [];
        let index = 0;

        return text.replace(this.patterns.codeBlock, (match, language, code) => {
            const placeholder = `___CODE_BLOCK_${index}___`;
            this.codeBlocks[index] = `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
            index++;
            return placeholder;
        });
    }

    /**
     * Restore code blocks after other parsing
     */
    restoreCodeBlocks(text) {
        if (!this.codeBlocks) return text;
        
        this.codeBlocks.forEach((block, index) => {
            text = text.replace(`___CODE_BLOCK_${index}___`, block);
        });
        
        return text;
    }

    /**
     * Parse headers (h1-h6)
     */
    parseHeaders(text) {
        text = text.replace(this.patterns.h6, '<h6>$1</h6>');
        text = text.replace(this.patterns.h5, '<h5>$1</h5>');
        text = text.replace(this.patterns.h4, '<h4>$1</h4>');
        text = text.replace(this.patterns.h3, '<h3>$1</h3>');
        text = text.replace(this.patterns.h2, '<h2>$1</h2>');
        text = text.replace(this.patterns.h1, '<h1>$1</h1>');
        return text;
    }

    /**
     * Parse horizontal rules
     */
    parseHorizontalRules(text) {
        return text.replace(this.patterns.hr, '<hr>');
    }

    /**
     * Parse blockquotes
     */
    parseBlockquotes(text) {
        const lines = text.split('\n');
        let inBlockquote = false;
        let blockquoteContent = [];
        const result = [];

        lines.forEach(line => {
            if (line.match(/^>\s+/)) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteContent = [];
                }
                blockquoteContent.push(line.replace(/^>\s+/, ''));
            } else {
                if (inBlockquote) {
                    result.push(`<blockquote>${blockquoteContent.join('\n')}</blockquote>`);
                    inBlockquote = false;
                    blockquoteContent = [];
                }
                result.push(line);
            }
        });

        if (inBlockquote) {
            result.push(`<blockquote>${blockquoteContent.join('\n')}</blockquote>`);
        }

        return result.join('\n');
    }

    /**
     * Parse lists (ordered and unordered)
     */
    parseLists(text) {
        const lines = text.split('\n');
        let inList = false;
        let listType = null;
        let listItems = [];
        const result = [];

        lines.forEach(line => {
            const unorderedMatch = line.match(/^[\*\-\+]\s+(.+)$/);
            const orderedMatch = line.match(/^\d+\.\s+(.+)$/);

            if (unorderedMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        result.push(this.closeList(listType, listItems));
                    }
                    inList = true;
                    listType = 'ul';
                    listItems = [];
                }
                listItems.push(unorderedMatch[1]);
            } else if (orderedMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) {
                        result.push(this.closeList(listType, listItems));
                    }
                    inList = true;
                    listType = 'ol';
                    listItems = [];
                }
                listItems.push(orderedMatch[1]);
            } else {
                if (inList) {
                    result.push(this.closeList(listType, listItems));
                    inList = false;
                    listType = null;
                    listItems = [];
                }
                result.push(line);
            }
        });

        if (inList) {
            result.push(this.closeList(listType, listItems));
        }

        return result.join('\n');
    }

    /**
     * Helper to close list tags
     */
    closeList(type, items) {
        const itemsHtml = items.map(item => `<li>${item}</li>`).join('');
        return `<${type}>${itemsHtml}</${type}>`;
    }

    /**
     * Parse images
     */
    parseImages(text) {
        return text.replace(this.patterns.image, '<img src="$2" alt="$1">');
    }

    /**
     * Parse links
     */
    parseLinks(text) {
        return text.replace(this.patterns.link, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    /**
     * Parse inline code
     */
    parseInlineCode(text) {
        return text.replace(this.patterns.inlineCode, '<code>$1</code>');
    }

    /**
     * Parse bold text
     */
    parseBold(text) {
        text = text.replace(this.patterns.bold, '<strong>$1</strong>');
        text = text.replace(this.patterns.boldAlt, '<strong>$1</strong>');
        return text;
    }

    /**
     * Parse italic text
     */
    parseItalic(text) {
        text = text.replace(this.patterns.italic, '<em>$1</em>');
        text = text.replace(this.patterns.italicAlt, '<em>$1</em>');
        return text;
    }

    /**
     * Parse strikethrough text
     */
    parseStrikethrough(text) {
        return text.replace(this.patterns.strikethrough, '<del>$1</del>');
    }

    /**
     * Parse paragraphs
     */
    parseParagraphs(text) {
        const lines = text.split('\n');
        const result = [];
        let paragraph = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Check if line is already a block element
            if (trimmed.match(/^<(h[1-6]|hr|blockquote|ul|ol|pre|table)/)) {
                if (paragraph.length > 0) {
                    result.push(`<p>${paragraph.join(' ')}</p>`);
                    paragraph = [];
                }
                result.push(line);
            } else if (trimmed === '') {
                if (paragraph.length > 0) {
                    result.push(`<p>${paragraph.join(' ')}</p>`);
                    paragraph = [];
                }
            } else {
                paragraph.push(trimmed);
            }
        });

        if (paragraph.length > 0) {
            result.push(`<p>${paragraph.join(' ')}</p>`);
        }

        return result.join('\n');
    }

    /**
     * Calculate reading time based on word count
     * @param {string} text - Text to analyze
     * @returns {number} - Estimated reading time in minutes
     */
    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownParser;
}
