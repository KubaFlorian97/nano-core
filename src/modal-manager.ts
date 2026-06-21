import { Disposable } from "./disposable";
import { DOMNode } from "./dom";
import { Modal, ModalConstructor, ModalContext } from "./modal";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class ModalManagerService<TStore> extends Disposable {
    private readonly _modals: Modal<TStore>[] = [];
    private readonly _modalContainer: DOMNode<Element>;
    private readonly _pageContainer: DOMNode<Element>;
    private readonly _store: TStore;

    private _lastPageFocusedElement: HTMLElement | null = null;
    private _isPageFOcusLocked = false;

    constructor(modalContainer: DOMNode<Element>, pageContainer: DOMNode<Element>, store: TStore) {
        super();
        this._modalContainer = modalContainer;
        this._pageContainer = pageContainer;
        this._store = store;

        this._modalContainer.style('display', 'none');
    }

    /**
     * Otwiera modal odkładając je na stos i blokując tło
     */
    public async open(ModalClass: ModalConstructor<TStore>): Promise<Modal<TStore>> {
        if (this._modals.length === 0) {
            this.saveAndLockPageFocus();
        } else {
            this._modals[this._modals.length - 1].attr('aria-hidden', 'true');
        }

        let modalInstance: Modal<TStore>;
        const context: ModalContext<TStore> = {
            store: this._store,
            close: async () => {
                if (modalInstance) await this.close(modalInstance);
            }
        };

        modalInstance = new ModalClass(context);
        this._modals.push(modalInstance);

        await modalInstance.onInit();
        modalInstance.mount(this._modalContainer);

        this.updateContainerVisibility();

        await modalInstance.onMount();
        modalInstance.focusFirstFocusable();

        return modalInstance;
    }

    /**
     * Zamyka konkretną instancję madala.
     */
    public async close(modal: Modal<TStore>): Promise<void> {
        const index = this._modals.indexOf(modal);
        if (index === -1) return;

        this._modals.splice(index, 1);

        await modal.onDestroy();
        modal.dispose();

        this.updateContainerVisisbility();

        if (this._modals.length > 0) {
            const topModal = this._modals[this._modals.length - 1];
            topModal.attr('aria-hidden', null);
            topModal.focusFirstFocusable();
        } else {
            this.restorePageFocus();
        }
    }

    public async closeAll(): Promise<void> {
        const modalsToClose = [...this._modals].reverse();
        for (const modal of modalsToClose) {
            await this.close(modal);
        }
    }

    private updateContainerVisisbility(): void {
        this._modalContainer.style('display', this._modals.length > 0 ? 'flex' : 'none');
    }

    private saveAndLockPageFocus(): void {
        if (this._isPageFOcusLocked) return;

        this._lastPageFocusedElement = document.activeElement as HTMLElement;

        const focusableElements = this._pageContainer.element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        focusableElements.forEach(el => {
            const currentTabIndex = el.getAttribute('tabindex');
        })
    }
}