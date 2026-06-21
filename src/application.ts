import { Disposable } from "./disposable";
import { create, DOMNode } from "./dom";
import { ModalManagerService } from "./modal-manager";
import { RouterService } from "./router";
import { Service } from "./service";

export interface ApplicationOptions {
    rootElement: HTMLElement;
    appClassName: string | string[];
}

export class Application<TStore> extends Disposable {
    public readonly store: TStore;

    public readonly appNode: DOMNode<HTMLDivElement>;
    public readonly pageContainer: DOMNode<HTMLDivElement>;
    public readonly modalContainer: DOMNode<HTMLDivElement>;

    public readonly router: RouterService<TStore>;
    public readonly modals: ModalManagerService<TStore>;

    private readonly _services: Map<string, Service> = new Map();

    constructor(store: TStore, options: ApplicationOptions) {
        super();
        this.store = store;

        this.appNode = create('div', this)
            .class(options.appClassName || 'nc-app');

        this.pageContainer = create('div', this)
            .class('nc-page-container')
            .mount(this.appNode);

        this.modalContainer = create('div', this)
            .class('nc-modal-container')
            .mount(this.appNode);

        this.appNode.mount(options.rootElement);

        this.router = new RouterService<TStore>(this.pageContainer, this.store);
        this.register(this.router);

        this.modals = new ModalManagerService<TStore>(this.modalContainer, this.pageContainer, this.store);
        this.register(this.modals);
    }

    /**
     * Rejestruje zewnętrzny serwis biznesowy
     */
    public registerService(service: Service): this {
        if (this._services.has(service.name)) {
            console.warn(`[NC App] Service ${service.name} is already registered.`);
            return this;
        }
        this._services.set(service.name, service);
        return this;
    }

    /**
     * Pobieranie instancji zarejestrowanego serwisu
     */
    public getService<T extends Service>(name: string): T | undefined {
        return this._services.get(name) as T | undefined;
    }

    /**
     * Cykl urubmieniowy aplikacji
     */
    public async start(): Promise<void> {
        try {
            for (const service of this._services.values()) {
                if (typeof service.load === 'function') {
                    await service.load();
                }
            }

            for (const service of this._services.values()) {
                if (typeof service.run === 'function') {
                    await service.run();
                }
            }

            await this.router.start();
        } catch (error) {
            console.error('[NC App] Fatal error during bootstrap sequence:', error);
        }
    }

    public override dispose(): void {
        if (this.disposed) return;
        super.dispose();
    }
}