import { Disposable } from "./disposable";

export abstract class Service extends Disposable {
    public abstract readonly name: string;

    /**
     * Ładowanie początkowe. Wywoływana sekwencyjnie dla każdego zarejestrowanego serwisu.
     */
    public async load(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Uruchomienie. Wywoływana gdy wszystkie serwisy zostaną załadowane.
     */
    public async run(): Promise<void> {
        return Promise.resolve();
    }
}