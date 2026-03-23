export interface BackButtonOptions {
    onClick: () => void;
    label?: string;
}

export class backButton {
    public readonly element: HTMLButtonElement;

    constructor({onClick, label = 'Back'}: BackButtonOptions) {
        this.element = document.createElement("button");
        this.element.className = 'back-button'

        const arrow = document.createElement('span');
        arrow.className = 'back-button__arrow';
        arrow.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.textContent = label;

        this.element.appendChild(arrow);
        this.element.appendChild(text);

        this.element.addEventListener('click', onClick)
    }
}