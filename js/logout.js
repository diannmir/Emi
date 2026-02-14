// js/logout.js
// Cierra sesion manualmente
document.getElementById("logout-btn")?.addEventListener("click", () => {
  sessionStorage.removeItem("auth");
  window.location.href = "./index.html";
});
