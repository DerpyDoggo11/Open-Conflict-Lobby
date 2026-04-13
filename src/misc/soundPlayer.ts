class UISounds {
  private hoverAudio: HTMLAudioElement;
  private clickAudio: HTMLAudioElement;

  constructor() {
    this.hoverAudio = new Audio('/assets/sounds/uiHover.mp3');
    this.clickAudio = new Audio('/assets/sounds/uiClick.mp3');

    this.hoverAudio.volume = 0.5;
    this.clickAudio.volume = 0.6;
  }

  playHover() {
    this.hoverAudio.currentTime = 0;
    this.hoverAudio.play();
  }

  playClick() {
    this.clickAudio.currentTime = 0;
    this.clickAudio.play();
  }

  attachToButton(btn: HTMLElement) {
    btn.addEventListener('mouseenter', () => this.playHover());
    btn.addEventListener('click', () => this.playClick());
  }
}

export const uiSounds = new UISounds();
