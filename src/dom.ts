import { Disposable } from "./disposable";
import { Value } from "./value";

const SVG_TAGS = new Set([
    "svg", "circle", "rect", "path", "line", "ellipse", "polygon", "polyline", "g", "defs", "symbol", "use", "text", "tspan"
]);

export function create<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    owner?: Disposable
): DOMNode<HTMLElementTagNameMap[K]>;
export function create<K extends keyof SVGElementTagNameMap>(
    tagName: K,
    owner?: Disposable
): DOMNode<SVGElementTagNameMap[K]>;
export function create(tagName: string, owner?: Disposable): DOMNode<Element> {
    const isSVG = SVG_TAGS.has(tagName);
    const element = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
        : document.createElement(tagName);

    return new DOMNode(element, owner);
}

export class DOMNode<T extends Element> extends Disposable {
    private readonly _element: T;
    private _owner?: Disposable;

    constructor(element: T, owner?: Disposable) {
        super();
        this._element = element;
        this._owner = owner;

        if (this._owner) {
            this._owner.register(this);
        }
    }

    public get element(): T {
        return this._element;
    }

    public override dispose(): void {
        if (this.disposed) return;

        if (this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }

        if (this._owner) {
            this._owner.unregister(this);
            this._owner = undefined;
        }

        super.dispose();
    }

    /**
     * Rejestracja EventListener z wykorzystaniem ścisłego mapowania typów
     */
    public on<K extends keyof GlobalEventHandlersEventMap>(
        eventType: K,
        listener: (this: T, ev: GlobalEventHandlersEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): this {
        const handler = listener as EventListener;
        this._element.addEventListener(eventType, handler, options);

        this.register(() => {
            this._element.removeEventListener(eventType, handler, options);
        });

        return this;
    }

    public text(content: string | Value<string | number>): this {
        if (content instanceof Value) {
            this.register(
                content.subscribe((val) => {
                    this._element.textContent = val !== null && val !== undefined ? String(val) : '';
                })
            );
        } else {
            this._element.textContent = String(content);
        }
        return this;
    }

    public class(className: string | string[], active: boolean | Value<boolean> = true): this {
        if (active instanceof Value) {
            this.register(
                active.subscribe((isActive) => this.toggleClass(className, isActive))
            );
        } else {
            this.toggleClass(className, active);
        }
        return this;
    }

    private toggleClass(className: string | string[], add: boolean): void {
        if (className) {
            const classes = Array.isArray(className) ? className : className.split(' ').filter(Boolean);
            if (add) {
                this._element.classList.add(...classes);
            } else {
                this._element.classList.remove(...classes);
            }
        }
    }

    public attr(
        name: string,
        value: string | number | boolean | null | Value<string | number | boolean | null>
    ): this {
        if (value instanceof Value) {
            this.register(
                value.subscribe((val) => this.setAttr(name, val))
            );
        } else {
            this.setAttr(name, value);
        }
        return this;
    }

    private setAttr(name: string, value: string | number | boolean | null): void {
        if (value === null || value === undefined || value === false) {
            this._element.removeAttribute(name);
        } else {
            this._element.setAttribute(name, value === true ? '' : String(value));
        }
    }

    public style(name: string): string | undefined;
    public style(name: string, value: string | Value<string>): this;
    public style(name: string, value: string | Value<string>, condition: boolean | Value<boolean>): this;
    public style(name: string, value?: string | Value<string>, condition?: boolean | Value<boolean>): this | string | undefined {
        const el = this._element as unknown as HTMLElement | SVGElement;

        if (!el.style) return this;
        if (value === undefined) return el.style.getPropertyValue(name);

        if (condition instanceof Value) {
            this.register(
                condition.subscribe((cond) => {
                    if (cond) {
                        if (value instanceof Value) {
                            this.register(value.subscribe((val) => el.style.setProperty(name, val)));
                        } else {
                            el.style.setProperty(name, value);
                        }
                    } else {
                        el.style.removeProperty(name);
                    }
                })
            );
        } else if (condition === true || condition === undefined) {
            if (value instanceof Value) {
                this.register(value.subscribe((val) => el.style.setProperty(name, val)));
            } else {
                el.style.setProperty(name, value);
            }
        } else {
            el.style.removeProperty(name);
        }
    }

    public display(isVisible: boolean | Value<boolean>): this {
        const el = this._element as unknown as HTMLElement | SVGElement;
        if (!el.style) return this;

        if (isVisible instanceof Value) {
            this.register(
                isVisible.subscribe((visible) => {
                    el.style.display = visible ? '' : 'none';
                })
            );
        } else {
            el.style.display = isVisible ? '' : 'none';
        }
        return this;
    }

    public append(...children: (DOMNode<any> | Element | string)[]): this {
        const fragment = document.createDocumentFragment();

        for (const child of children) {
            if (child instanceof DOMNode) fragment.appendChild(child.element);
            else if (child instanceof Element) fragment.appendChild(child);
            else fragment.appendChild(document.createTextNode(String(child)));
        }

        this._element.appendChild(fragment);
        return this;
    }

    public mount(parent: Element | DOMNode<any>, first = false): this {
        const target = parent instanceof DOMNode ? parent.element : parent;
        if (first && target.firstChild) {
            target.insertBefore(this._element, target.firstChild);
        } else {
            target.appendChild(this._element);
        }
        return this;
    }

    /**
     * WCAG - przesuwa natywnie focus na pierwszy wspierany element w danym węźle
     */
    public focusFirstFocusable(): this {
        if (this._element instanceof HTMLElement || this._element instanceof SVGElement) {
            const focusable = this._element.querySelector<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusable) {
                queueMicrotask(() => focusable.focus());
            }
        }
        return this;
    }
}