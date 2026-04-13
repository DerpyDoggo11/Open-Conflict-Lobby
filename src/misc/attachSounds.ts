import { uiSounds } from './soundPlayer.js';

export function attachUISounds(root: HTMLElement) {
  const buttons = root.querySelectorAll('button');

  buttons.forEach(btn => {
    uiSounds.attachToButton(btn as HTMLElement);
  });
}
