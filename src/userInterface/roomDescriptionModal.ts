export function showRoomDescriptionModal(roomName: string, flavorText: string): Promise<void> {
  const modal = document.getElementById('room-description-modal') as HTMLDialogElement | null;
  const titleEl = document.getElementById('room-modal-title');
  const flavorEl = document.getElementById('room-modal-flavor');
  const enterBtn = document.getElementById('btn-room-enter') as HTMLButtonElement | null;

  if (!modal) {
    return Promise.resolve();
  }

  if (titleEl) {
    titleEl.textContent = roomName;
  }
  if (flavorEl) {
    flavorEl.textContent = flavorText;
  }

  modal.showModal();

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      modal.close();
      if (enterBtn) {
        // Clean up event listener by replacing the element
        enterBtn.replaceWith(enterBtn.cloneNode(true));
      }
    };

    const getEnterBtn = () => document.getElementById('btn-room-enter');

    getEnterBtn()?.addEventListener('click', () => {
      cleanup();
      resolve();
    }, { once: true });

    modal.addEventListener('cancel', (e) => {
      e.preventDefault(); // Prevent closing via ESC to force button click
    });
  });
}
