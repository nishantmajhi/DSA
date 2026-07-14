document.addEventListener("DOMContentLoaded", () => {
  const toast = document.createElement("div");
  const toastText = document.createElement("span");

  Object.assign(toast.style, {
    borderLeft: "6px solid green",
    padding: "1rem 1.5rem",
    position: "fixed",
    bottom: "0.5rem",
    right: "0",
    zIndex: "2",
    opacity: "0",
    fontSize: "1rem",
    fontFamily: "system-ui, sans-serif",
    pointerEvents: "none",
    transform: "translateX(100%)",
    backgroundColor: "#3d2415",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  });

  toast.appendChild(toastText);
  document.body.appendChild(toast);

  function showToast(message, isSuccess = true, onComplete = function () {}) {
    toastText.textContent = message;
    toast.style.borderLeftColor = isSuccess ? "rebeccapurple" : "crimson";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      onComplete();
    }, 2500);
  }

  document.querySelectorAll("code.javascript").forEach((codeBlock) => {
    const wrapper = codeBlock.parentNode;
    wrapper.style.position = "relative";

    const button = document.createElement("button");
    button.textContent = "📋";
    button.title = "Copy to clipboard";
    button.setAttribute("aria-label", "Copy to clipboard");

    Object.assign(button.style, {
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.5rem",
      position: "absolute",
      top: "0",
      right: "0",
      zIndex: "1",
      cursor: "pointer",
      fontSize: "1.5rem",
      background: "transparent",
    });

    button.addEventListener("click", () => {
      const text = codeBlock.textContent;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          button.textContent = "✔️";
          button.setAttribute("aria-label", "Copied to clipboard");
          showToast("Code copied successfully!", true, function () {
            button.textContent = "📋";
            button.setAttribute("aria-label", "Copy to clipboard");
          });
        })
        .catch(() => {
          showToast("Code could not be copied!", false);
        });
    });

    const hoverColor = "rgba(20, 20, 20, 0.8)";
    const resetColor = "transparent";

    ["mouseenter", "focus"].forEach((evt) =>
      button.addEventListener(evt, () => {
        button.style.backgroundColor = hoverColor;
      })
    );

    ["mouseleave", "blur"].forEach((evt) =>
      button.addEventListener(evt, () => {
        button.style.backgroundColor = resetColor;
      })
    );

    wrapper.appendChild(button);
  });
});
