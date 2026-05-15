const normalizeBasePath = (value) => {
    if (!value || value === '/') {
        return '';
    }

    const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
    return withLeadingSlash.endsWith('/')
        ? withLeadingSlash.slice(0, -1)
        : withLeadingSlash;
};

export const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL || '/');

export const withBasePath = (path = '/') => {
    if (!path || path === '/') {
        return APP_BASE_PATH || '/';
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${APP_BASE_PATH}${normalizedPath}` || normalizedPath;
};
