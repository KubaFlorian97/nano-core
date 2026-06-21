import { Disposable, DisposeFn } from "./disposable";

export type EmitterCallbackFn<T> = (event: T) => void;

interface EmitterHandle<T> {
    callback: EmitterCallbackFn<T>;
    once: boolean;
}

export class Emitter<TEventMap extends Record<string, unknown>> extends Disposable {
    private _handlers: Partial<Record<keyof TEventMap, Set<EmitterHandle<any>>>> = {};

    public override dispose(): void {
        if (this.disposed) return;
        this._handlers = {};
        super.dispose();
    }

    /**
     * Subskrybuje zdarzenie.
     */
    public on<K extends keyof TEventMap>(
        eventName: K,
        callback: EmitterCallbackFn<TEventMap[K]>,
        owner?: Disposable
    ): DisposeFn {
        return this._addCallback(eventName, callback, false, owner);
    }

    /**
     * Subskrybuje zdarzenie na tylko jedno wywołanie.
     */
    public once<K extends keyof TEventMap>(
        eventName: K,
        callback: EmitterCallbackFn<TEventMap[K]>,
        owner?: Disposable
    ): DisposeFn {
        return this._addCallback(eventName, callback, true, owner);
    }

    /**
     * Emituje zadarzenie przekazując ładunek do wszyskich subkrybentów
     */
    public emit<K extends keyof TEventMap>(eventName: K, payload: TEventMap[K]): void {
        const handlers = this._handlers[eventName];
        if (!handlers) return;

        const handlersToExecute = Array.from(handlers);

        for (const handle of handlersToExecute) {
            handle.callback(payload);
            if (handle.once) {
                handlers.delete(handle);
            }
        }
    }

    private _addCallback<K extends keyof TEventMap>(
        eventName: K,
        callback: EmitterCallbackFn<TEventMap[K]>,
        once: boolean,
        owner?: Disposable
    ): DisposeFn {
        if (!this._handlers[eventName]) {
            this._handlers[eventName] = new Set();
        }

        const handle: EmitterHandle<TEventMap[K]> = { callback, once };
        this._handlers[eventName]!.add(handle);

        const unsubscribe = () => {
            if (this._handlers[eventName]) {
                this._handlers[eventName].delete(handle);
            }
        };

        if (owner) {
            owner.register(unsubscribe);
        }

        return unsubscribe;
    }
}