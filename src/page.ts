import { DOMNode, create } from "./dom";

export interface PageContext<TStore> {
    store: TStore;
    navigate: (path: string) => void;
}

export type PageConstructor<TStore> = new (context: PageContext<TStore>) => Page<TStore>;

export abstract class Page<TStore> extends DOMNode<HTMLDivElement> {
    protected readonly store: TStore;
    protected readonly navigate: (path: string) => void;

    constructor(context: PageContext<TStore>) {
        super(document.createElement('div'));

        this.store = context.store;
        this.navigate = context.navigate;

        this.class(['page', this.constructor.name]);
    }

    public async onInit(): Promise<void> {
        return Promise.resolve();
    }

    public async onMount(): Promise<void> {
        return Promise.resolve();
    }

    public async onDestroy(): Promise<void> {
        return Promise.resolve();
    }
}