// Shared utility hooks and functions for POS components
import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for notifications with proper cleanup
 * Prevents memory leaks from setTimeout
 */
export const useNotification = (setNotification) => {
    const timerRef = useRef(null);

    const showNotification = useCallback((message, type = 'success') => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setNotification({ show: true, message, type });
        timerRef.current = setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3500);
    }, [setNotification]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return showNotification;
};

/**
 * Standardized API error handler
 * Provides user-friendly messages
 */
export const createApiErrorHandler = (showNotification) => {
    return useCallback((error, defaultMessage = 'An error occurred') => {
        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors || {};
            const firstError = Object.values(validationErrors)[0]?.[0];
            showNotification(firstError || 'Please check your input', 'error');
            return validationErrors;
        } else if (error.response?.data?.message) {
            showNotification(error.response.data.message, 'error');
        } else {
            showNotification(defaultMessage, 'error');
        }
        return {};
    }, [showNotification]);
};

/**
 * Extract paginated data from various API response formats
 */
export const extractPaginatedData = (response) => {
    return response?.data?.pagination?.data
        || response?.data?.data
        || response?.data
        || [];
};

/**
 * Extract pagination metadata
 */
export const extractPaginationMeta = (response, defaultPerPage = 12) => {
    const pagination = response?.data?.pagination;
    return {
        current_page: pagination?.current_page || 1,
        last_page: pagination?.total_pages || 1,
        per_page: pagination?.per_page || defaultPerPage,
        total_items: pagination?.total_items || 0,
    };
};
