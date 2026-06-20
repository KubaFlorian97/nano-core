import { mergeDeep } from "./common";
import { Disposable } from "./disposable";

export type ListenerFn<T> = (value: T, prev: T | undefined) => void;

let isBatching = false;
const pendingNotifications = new Set<() => void>();

/**
 * Uruchamia transakcję grupującą zmiany stanu.
 */
export function batch(fn: () => void): void {
    if (isBatching) {
        fn();
        return;
    }

    isBatching = true;
    try {
        fn();
    } finally {
        isBatching = false;

        const tasks = Array.from(pendingNotifications);
        pendingNotifications.clear()

        tasks.forEach(task => task());
    }
}

/**
 * Bazowa klasa Value
 */
export abstract class Value<T> extends Disposable {
    abstract get(): T;
    abstract subscribe(callback: ListenerFn<T>, owner?: Disposable): () => void;

    /**
     * Reaktywne mapowanie stanu.
     */
    public map<U>(transform: (value: T) => U, owner?: Disposable): Value<U> {
        return new ValueObserver<U, T>(this, transform, owner);
    }

    /**
     * Reaktywny test równości
     */
    public equal(test: T | ((value: T) => boolean), owner?: Disposable): Value<boolean> {
        const check = typeof test === 'function'
            ? (test as (value: T) => boolean)
            : (val: T) => val === test;

        return this.map(check, owner);
    }
}

/**
 * Kontener stanu
 */
export class ValueStore<T> extends Value<T> {
    private readonly listeners: Set<ListenerFn<T>> = new Set();
    protected value: T;
    protected prev: T | undefined;

    constructor(initialValue: T, owner?: Disposable) {
        super();
        this.value = initialValue;
        if (owner) {
            owner.register(this);
        }
    }

    public override dispose(): void {
        if (this.disposed) return;
        this.listeners.clear();
        super.dispose();
    }

    public subscribe(callback: ListenerFn<T>, owner?: Disposable): () => void {
        this.listeners.add(callback);

        queueMicrotask(() => {
            if (!this.disposed && this.listeners.has(callback)) {
                callback(this.value, this.prev);
            }
        });

        const unsubscribe = () => this.listeners.delete(callback);

        if (owner) {
            owner.register(unsubscribe);
        }

        return unsubscribe;
    }

    public set(newValue: T): void {
        if (this.value === newValue) return;

        this.prev = this.get();

        if (Array.isArray(newValue)) {
            this.value = [...newValue] as unknown as T;
        } else if (newValue !== null && typeof newValue === 'object') {
            const base = (Array.isArray(this.value) ? {} : this.value || {}) as Record<string, unknown>;
            this.value = mergeDeep(base, newValue as Record<string, unknown>) as T;
        } else {
            this.value = newValue;
        }

        this.notify();
    }

    public get(): T {
        if (Array.isArray(this.value)) {
            return [...this.value] as unknown as T;
        }
        if (this.value !== null && typeof this.value === 'object') {
            return mergeDeep({}, this.value as Record<string, unknown>) as T;
        }
        return this.value;
    }

    public notify(): void {
        const notificationTask = () => {
            for (const listener of this.listeners) {
                listener(this.value, this.prev);
            }
        };
        if (isBatching) {
            pendingNotifications.add(notificationTask);
        } else {
            queueMicrotask(notificationTask);
        }
    }
}

/**
 * Obserwator transformacji
 */
export class ValueObserver<K, T> extends Value<K> {
    private readonly listeners: Set<ListenerFn<K>> = new Set();
    private value: K;
    private prev: K | undefined;
    private readonly unsubscribeFn: () => void;

    constructor(
        private readonly watch: Value<T>,
        private readonly transform: (value: T) => K,
        owner?: Disposable
    ) {
        super();
        this.value = this.transform(this.watch.get());

        this.unsubscribeFn = this.watch.subscribe((newValue) => {
            const transformed = this.transform(newValue);

            if (this.value !== this.transform(newValue)) {
                this.prev = this.value;
                this.value = transformed;
                this.notify();
            }
        });

        if (owner) {
            owner.register(this);
        }
    }

    public override dispose(): void {
        if (this.disposed) return;
        this.unsubscribeFn();
        this.listeners.clear();
        super.dispose();
    }

    public get(): K {
        return this.value;
    }

    public subscribe(callback: ListenerFn<K>, owner?: Disposable): () => void {
        this.listeners.add(callback);

        queueMicrotask(() => {
            if (!this.disposed && this.listeners.has(callback)) {
                callback(this.value, this.prev);
            }
        });

        const unsubscribe = () => this.listeners.delete(callback);

        if (owner) {
            owner.register(unsubscribe);
        }

        return unsubscribe;
    }

    public notify(): void {
        const notificationTask = () => {
            for (const listener of this.listeners) {
                listener(this.value, this.prev);
            }
        };
        if (isBatching) {
            pendingNotifications.add(notificationTask);
        } else {
            queueMicrotask(notificationTask);
        }
    }
}