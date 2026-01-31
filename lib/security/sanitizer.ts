
import sanitizeHtml from 'sanitize-html';

export const sanitizeContent = (content: string): string => {
    return sanitizeHtml(content, {
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
            'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'
        ],
        allowedAttributes: {
            '*': ['class', 'style'],
            'a': ['href', 'name', 'target'],
            'img': ['src', 'alt', 'width', 'height']
        },
        allowedSchemes: ['http', 'https', 'mailto', 'data'],
        // Use defaults for others (strips script, iframe, etc. as they are not in allowedTags)
    });
};
