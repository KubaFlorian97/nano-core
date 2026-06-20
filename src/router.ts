import { Disposable } from './disposable';
import { DOMNode } from './dom';
import { Page, PageConstructor, PageContext } from './page';
import { ValueStore } from './value';

export class RouterService<TStore> extends Disposable {
    private readonly _routes: Map<string, PageConstructor<TStore>> = new Map();
    private _currentPage?: Page<TStore>;

    private readonly _container: DOMNode<Element>;
    private readonly _context: PageContext<TStore>;

    public readonly currentPath = new ValueStore<string>('/');

    constructor(container: DOMNode<Element>, store: TStore) {
        super();
        this._container = container;

        this._context = {
            store,
            navigate: (path: string) => this.navigate(path)
        };

        const handleHashChange = () => this.handleRouteChange();
        window.addEventListener('hashchange', handleHashChange);

        this.register(() => {
            window.removeEventListener('hashchange', handleHashChange);
        });
    }

    /**
     * Rejestruje ścieżkę dla danej klasy widoku.
     */
    public addRoute(path: string, pageClass: PageConstructor<TStore>): this {
        this._routes.set(path, pageClass);
        return this;
    }

    public navigate(path: string): void {
        window.location.hash = path;
    }

    public async start(): Promise<void> {
        if (!window.location.hash) {
            window.location.hash = '/';
        } else {
            await this.handleRouteChange();
        }
    }

    private async handleRouteChange(): Promise<void> {
        const path = window.location.hash.replace('#', '') || '/';
        const PageClass = this._routes.get(path) || this._routes.get('*');

        if (!PageClass) {
            console.error(`[Router] Route not found for path: ${path}. Provide a fallback route '*'.`);
            return;
        }

        if (this._currentPage && this._currentPage.constructor === PageClass) {
            return;
        }

        // Odpinanie starego widoku
        if (this._currentPage) {
            await this._currentPage.onDestroy();
            this._currentPage.dispose();
            this._currentPage = undefined;
        }

        this._container.element.innerHTML = '';
        this.currentPath.set(path);

        // Tworzenie i wpinanie nowego widoku
        this._currentPage = new PageClass(this._context);

        await this._currentPage.onInit();
        this._currentPage.mount(this._container);
        await this._currentPage.onMount();
    }

    public override dispose(): void {
        if (this._currentPage) {
            this._currentPage.onDestroy().finally(() => {
                this._currentPage?.dispose();
            });
        }
        super.dispose();
    }
}