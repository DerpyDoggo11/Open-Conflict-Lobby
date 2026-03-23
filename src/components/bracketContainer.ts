// =========================================================
//  BracketContainer.ts
//  Panel decorated with a background image.
// =========================================================

export interface BracketContainerOptions {
  /** Extra CSS classes to add to the wrapper element. */
  className?: string;
  /** Optional label displayed inside the container. */
  label?: string;
}

export class BracketContainer {
  public readonly element: HTMLDivElement;

  constructor(options: BracketContainerOptions = {}) {
    const { className = '', label } = options;

    this.element = document.createElement('div');
    this.element.className = ['bracket-container', className]
      .filter(Boolean)
      .join(' ');

    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'label--section';
      labelEl.textContent = label;
      this.element.appendChild(labelEl);
    }
  }

  append(...children: HTMLElement[]): void {
    for (const child of children) {
      this.element.appendChild(child);
    }
  }
}