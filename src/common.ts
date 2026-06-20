/**
 * Sprawdza czy wartość jest czystym obiektem (Record)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof RegExp) &&
        !(value instanceof Date)
    );
}

/**
 * Sprawdza czy wartość jest funkcją
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
}

/**
 * Sprawdza czy wartość jest zdefiniowana
 */
export function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

/**
 * Sprawdza czy obiekt posiada własną właściwość
 */
export function hasOwnProperty<K extends PropertyKey>(
    value: unknown,
    name: K
): value is Record<K, unknown> {
    return isObject(value) && Object.hasOwn(value, name);
}

/**
 * Sprawdza czy obiekt ma własną właściowość, którą jest funkcja
 */
export function hasOwnFunction(value: unknown, name: string): boolean {
    return hasOwnProperty(value, name) && isFunction(value[name]);
}

/**
 * Sprawdza czy wartość jest logicznie pusta
 */
export function isEmpty(value: unknown): boolean {
    if (value === undefined || value === null || value === '' || value === 0) {
        return true;
    }

    if (Array.isArray(value) && value.length === 0) return true;
    if (isObject(value) && Object.keys(value).length === 0) return true;

    return false;
}

/**
 * Normalizuje różne reprezentacje prawdy do stanu boolean
 */
export function isTrue(value: unknown): boolean {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['true', 'yes', 'on', 't', '1'].includes(normalized);
    }
    return false;
}

/**
 * Normalizuje różne reprezentacje fałszu do stanu boolean
 */
export function isFalse(value: unknown): boolean {
    if (value === false || value === 0) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['false', 'no', 'off', 'n', '0'].includes(normalized);
    }
    return false;
}

/**
 * Rekurencyjnie łączy obiety źródłowe do obiektu docelowego.
 * @param target Obiekt docelowy
 * @param sources Obiekty źródłowe
 * @returns Zmodyfikowany obiekt docelowy
 */
export function mergeDeep(
    target: Record<string, unknown>,
    ...sources: Record<string, unknown>[]
): Record<string, unknown> {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }

            if (isObject(source[key])) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                mergeDeep(
                    target[key] as Record<string, unknown>,
                    source[key] as Record<string, unknown>
                );
            } else {
                target[key] = source[key];
            }
        }
    }

    return mergeDeep(target, ...sources);
}