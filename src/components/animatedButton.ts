export interface animatedButtonOptions {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    width?: string;
    className?: string;
    frameInterval?: number;
}

export class animatedButton {
    public readonly element: HTMLButtonElement;
    
    private _frame = 0;
    private readonly _totalFrames = 4;
    private _animTimer: ReturnType<typeof setInterval> | null = null;
    private _direction: 1 | -1 = 1;
    private _frameWidth = 0;
    private _frameInterval: number;

    constructor(options: animatedButtonOptions) {
        const {
            label,
            onClick,
            disabled = false,
            width,
            className = '',
            frameInterval = 40,
        } = options;

        this._frameInterval = frameInterval;

        this.element = document.createElement('button');
        this.element.className = ['animated-button', className]
            .filter(Boolean)
            .join(' ');
        this.element.textContent = label;
        this.element.disabled = disabled;

        if (width) this.element.style.width = width;
        if (onClick) this.element.addEventListener('click', onClick);

        this.element.addEventListener('mouseenter', () => this._startAnim(1));
        this.element.addEventListener('mouseleave', () => this._startAnim(-1));

        this._checkSpriteLoaded();
    }

    setDisabled(disabled: boolean): void {
        this.element.disabled = disabled;
        this.element.classList.toggle('animated-button--disabled', disabled);
        if (disabled) {
        this._stopAnim();
        this._setFrame(0);
        }
    }

    setLabel(label: string): void {
        this.element.textContent = label;
    }

    private _startAnim(direction: 1 | -1): void {
        if (this.element.disabled) return;
        this._direction = direction;
        this._stopAnim();

        this._animTimer = setInterval(() => {
        const next = this._frame + this._direction;

        if (next < 0 || next >= this._totalFrames) {
            this._stopAnim();
            return;
        }

        this._setFrame(next);
        }, this._frameInterval);
    }

    private _stopAnim(): void {
        if (this._animTimer !== null) {
            clearInterval(this._animTimer);
            this._animTimer = null;
        }
    }

    private _setFrame(index: number): void {
        this._frame = index;
        const offset = index * this._frameWidth;
        this.element.style.backgroundPositionX = `-${offset}px`;
    }

    private _checkSpriteLoaded(): void {
        const style = getComputedStyle(document.documentElement);
        const spritePath = style.getPropertyValue('--animated-button-path').trim();
        const widthValue = style.getPropertyValue('--animated-button-width').trim();

        this._frameWidth = parseFloat(widthValue) || 0;

        const match = spritePath.match(/url\(['"]?(.+?)['"]?\)/);
        if (!match) return;

        const img = new Image();
        img.onload = () => {
            if (!this._frameWidth) {
                this._frameWidth = img.naturalWidth / this._totalFrames;
            }
            this.element.classList.add('animated-button--loaded');
            this._setFrame(0);
        };
        img.src = match[1];
    }
}