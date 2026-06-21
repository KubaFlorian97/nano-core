import { DOMNode } from "./dom";

/**
 * Kontekst wstrzykiwany do każdego modala.
 */
export interface ModalContext<TStore> {
    store: TStore;
    close: () => Promise<void>;
}

export type ModalConstructor<TStore> = new (context: ModalContext<TStore>) => Modal<TStore>;

/**
 * Klasa bazowa reprezentująca okno modalne
 */
export abstract class Modal<TStore> extends DOMNode<HTMLDivElement> {
    protected readonly store: TStore;
    protected readonly close: () => Promise<void>;

    constructor(context: ModalContext<TStore>) {
        super(document.createElement('div'));

        this.store = context.store;
        this.close = context.close;

        this.class(['modal', this.constructor.name]);

        this.attr('role', 'dialog');
        this.attr('aria-modal', 'true');
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