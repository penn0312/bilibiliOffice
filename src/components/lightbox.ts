export class Lightbox {
  private dialog: HTMLDialogElement | null = null;
  private abort: AbortController | null = null;
  open(src: string) {
    this.close();
    const d = document.createElement("dialog");
    d.className = "bo-image-dialog";
    d.setAttribute("aria-label", "评论图片预览");
    const img = document.createElement("img");
    img.src = src;
    img.alt = "评论图片";
    const close = document.createElement("button");
    close.textContent = "关闭图片";
    close.type = "button";
    close.onclick = () => this.close();
    d.append(img, close);
    document.getElementById("bilioffice-root")?.append(d);
    this.dialog = d;
    this.abort = new AbortController();
    d.addEventListener(
      "cancel",
      (e) => {
        e.preventDefault();
        this.close();
      },
      { signal: this.abort.signal },
    );
    d.addEventListener(
      "click",
      (e) => {
        if (e.target === d) this.close();
      },
      { signal: this.abort.signal },
    );
    d.showModal();
    close.focus();
  }
  close() {
    this.abort?.abort();
    this.abort = null;
    this.dialog?.close();
    this.dialog?.remove();
    this.dialog = null;
  }
}
