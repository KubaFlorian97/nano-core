/**
 * Interface dla obiektów, które wymagają jawnego zwolnienia zasobów.
 */
export interface IDisposable {
    dispose(): void;
}

/**
 * Funkcja czyszcząca
 */
export type DisposeFn = () => void;

/**
 * Typ pomocniczy dla elementów, które mogą zostać zarejestrowane do usunięcia.
 */
export type RegisteredDisposable = IDisposable | DisposeFn;

/**
 * Klasa bazowa zarządzająca cyklem życia zasobu.
 * Zwalnianie pamięci (LIFO) i anulowanie operacji async.
 */
export abstract class Disposable implements IDisposable {
    private _disposed = false;
    private readonly _disposables: Map<unknown, DisposeFn> = new Map();
    private _abortController?: AbortController;

    protected constructor() { }

    /**
     * Informacja czy zasób został zniszczony.
     */
    public get disposed(): boolean {
        return this._disposed;
    }

    /**
     * Zwraca AbortSignal powiązany z cyklem życia obiektu.
     * Sygnał wyzwolony w momencie wywołania `dispose()`.
     */
    public get abortSignal(): AbortSignal {
        if (!this._abortController) {
            this._abortController = new AbortController();
        }
        return this._abortController.signal;
    }

    /**
     * Zwalnia wszystkie zarejestrowane zasoby (LIFO).
     */
    public dispose(): void {
        if (this._disposed) {
            return;
        }

        this._disposed = true;

        if (this._abortController) {
            this._abortController.abort(new Error("Object has been disposed."));
        }

        const disposables = Array.from(this._disposables.values()).reverse();

        for (const disposeFn of disposables) {
            try {
                disposeFn();
            } catch (error) {
                console.warn(`[Disposable] Error during resource disposal:`, error);
            }
        }

        this._disposables.clear();
    }

    /**
     * Rejestracja funkcji czyszczącej lub init `IDisposable`.
     * Zwraca zarejestrowany obiekt.
     */
    public register<T extends RegisteredDisposable>(disposable: T): T {
        if (this._disposed) {
            console.warn("[Disposable] Cannot register a resource on an already disposed instance.");
            return disposable;
        }

        if (this._disposables.has(disposable)) {
            return disposable;
        }

        if (typeof disposable === "function") {
            this._disposables.set(disposable, disposable as DisposeFn);
        } else if (disposable !== null && typeof disposable === "object" && "dispose" in disposable) {
            const disposeMethod = (disposable as IDisposable).dispose;
            if (typeof disposeMethod === "function") {
                this._disposables.set(disposable, disposeMethod.bind(disposable));
            }
        }

        return disposable;
    }

    /**
     * Usuwa zasób z rejestru czyszczenia.
     */
    public unregister(disposable: unknown): void {
        this._disposables.delete(disposable);
    }
}