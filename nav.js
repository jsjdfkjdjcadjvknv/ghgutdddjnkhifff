document.addEventListener("DOMContentLoaded", () => {
  // ==================== MOBILE MENU ====================
  const menuBtn = document.querySelector(".menu-btn");
  const mobileNav = document.querySelector(".nav-mobile");

  if (menuBtn && mobileNav) {
    menuBtn.onclick = () => mobileNav.classList.toggle("active");
  }

  // ==================== INSTRUCTION MODAL ====================
  const modal = document.getElementById("instructions-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  if (modal) {
    modal.style.display = "block";

    if (modalCloseBtn) {
      modalCloseBtn.onclick = () => (modal.style.display = "none");
    }

    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }
});
