export class InputService {
  constructor(pad, onPause) {
    this.keys = new Set();
    this.pointer = null;
    this.axis = { x: 0, z: 0 };
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
          // Prevent the same key from opening and immediately cancelling a dialog.
          e.preventDefault();
          if (!e.repeat) onPause();
        }
      },
      options,
    );
    window.addEventListener("keyup", (e) => this.keys.delete(e.code), options);
    window.addEventListener("blur", () => this.clear(), options);
    const move = (e) => {
      const rect = pad.getBoundingClientRect(),
        x = (e.clientX - rect.left - rect.width / 2) / 45,
        z = (e.clientY - rect.top - rect.height / 2) / 45;
      const length = Math.max(1, Math.hypot(x, z));
      this.axis = { x: x / length, z: z / length };
      pad.firstElementChild.style.transform = `translate(${this.axis.x * 32}px,${this.axis.z * 32}px)`;
    };
    pad.addEventListener(
      "pointerdown",
      (e) => {
        if (this.pointer !== null) return;
        this.pointer = e.pointerId;
        pad.setPointerCapture(e.pointerId);
        move(e);
      },
      options,
    );
    pad.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerId === this.pointer) move(e);
      },
      options,
    );
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
      pad.addEventListener(
        event,
        (e) => {
          if (e.pointerId === this.pointer) {
            this.pointer = null;
            this.axis = { x: 0, z: 0 };
            pad.firstElementChild.style.transform = "";
          }
        },
        options,
      );
    this.pad = pad;
  }
  read() {
    const has = (...keys) => keys.some((key) => this.keys.has(key));
    const x =
      Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft"));
    const z = Number(has("KeyS", "ArrowDown")) - Number(has("KeyW", "ArrowUp"));
    return x || z ? { x, z } : this.axis;
  }
  clear() {
    this.keys.clear();
    this.axis = { x: 0, z: 0 };
    this.pointer = null;
    this.pad.firstElementChild.style.transform = "";
  }
  dispose() {
    this.controller.abort();
    this.clear();
  }
}
