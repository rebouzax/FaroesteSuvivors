export class InputService {
  constructor(surface, pad, onPause, canMove = () => true) {
    this.keys = new Set();
    this.pointer = null;
    this.origin = null;
    this.axis = { x: 0, z: 0 };
    this.surface = surface;
    this.pad = pad;
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };

    window.addEventListener(
      "keydown",
      (e) => {
        if (
          [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
          ].includes(e.code)
        ) {
          e.preventDefault();
          this.keys.add(e.code);
        }
        if (e.code === "Escape") {
          e.preventDefault();
          if (!e.repeat) onPause();
        }
      },
      options,
    );
    window.addEventListener("keyup", (e) => this.keys.delete(e.code), options);
    window.addEventListener("blur", () => this.clear(), options);

    surface.addEventListener(
      "pointerdown",
      (e) => {
        // HUD buttons and dialogs are outside the surface and retain their taps.
        if (
          e.pointerType !== "touch" ||
          !e.isPrimary ||
          this.pointer !== null ||
          !canMove()
        ) return;

        e.preventDefault();
        this.pointer = e.pointerId;
        this.origin = { x: e.clientX, y: e.clientY };
        pad.style.left = `${e.clientX}px`;
        pad.style.top = `${e.clientY}px`;
        pad.classList.add("is-active");
        try {
          surface.setPointerCapture(e.pointerId);
        } catch {
          // Window listeners still receive movement on this page.
        }
      },
      options,
    );

    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerId !== this.pointer) return;
        if (!canMove()) {
          this.clear();
          return;
        }
        e.preventDefault();
        const x = (e.clientX - this.origin.x) / 45;
        const z = (e.clientY - this.origin.y) / 45;
        const length = Math.max(1, Math.hypot(x, z));
        this.axis = { x: x / length, z: z / length };
        pad.firstElementChild.style.transform = `translate(${this.axis.x * 32}px, ${this.axis.z * 32}px)`;
      },
      options,
    );

    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      window.addEventListener(
        event,
        (e) => {
          if (e.pointerId === this.pointer) this.clearTouch();
        },
        options,
      );
  }

  read() {
    const has = (...keys) => keys.some((key) => this.keys.has(key));
    const x =
      Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft"));
    const z = Number(has("KeyS", "ArrowDown")) - Number(has("KeyW", "ArrowUp"));
    return x || z ? { x, z } : this.axis;
  }

  clearTouch() {
    const pointer = this.pointer;
    this.pointer = null;
    this.origin = null;
    this.axis = { x: 0, z: 0 };
    this.pad.classList.remove("is-active");
    this.pad.firstElementChild.style.transform = "";
    if (pointer !== null && this.surface.hasPointerCapture(pointer))
      this.surface.releasePointerCapture(pointer);
  }

  clear() {
    this.keys.clear();
    this.clearTouch();
  }

  dispose() {
    this.clear();
    this.controller.abort();
  }
}
