export const sanitizeHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
};

export const stripTags = (input) => {
    if (!input) return '';
    return input.replace(/<[^>]*>?/gm, '');
};

export const sanitizeObject = (obj) => {
    const sanitized = {};
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            sanitized[key] = stripTags(obj[key]);
        } else {
            sanitized[sanitized] = obj[key];
        }
    }
    return sanitized;
};
