document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  footerDetails = footer.querySelector("details");
  const iframe = document.querySelector("iframe[name='view']");

  if (header && footer && iframe) updateIframeHeight();
  window.addEventListener("resize", updateIframeHeight);
  footerDetails.addEventListener("toggle", updateIframeHeight);

  const headerItems = header.querySelectorAll("ul li");
  let activeItem = header.querySelector("ul li:first-child");
  activeItem.style.backgroundColor = "var(--background-color)";
  activeItem.querySelector("a").setAttribute("aria-current", "page");

  headerItems.forEach((li, index) => {
    const a = li.querySelector("a");
    a.addEventListener("click", () => {
      if (activeItem) {
        activeItem.style.backgroundColor = "";
        activeItem.querySelector("a").removeAttribute("aria-current");
      }

      li.style.backgroundColor = "var(--background-color)";
      a.setAttribute("aria-current", "page");
      activeItem = li;

      if (index === 0) {
        footerDetails.open = true;
      } else {
        footerDetails.open = false;
      }

      updateIframeHeight();
    });
  });

  function updateIframeHeight() {
    const paddingValue = "1rem";
    iframe.style.height = `calc(${
      window.innerHeight - header.offsetHeight - footer.offsetHeight
    }px - 2 * ${paddingValue})`;
  }
});
