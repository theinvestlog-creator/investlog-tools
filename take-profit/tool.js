// No business logic yet — this file just wires up the date picker and a stub.
(function(){
  function initDatePicker(){
    if (window.flatpickr) {
      window.flatpickr("#purchaseDate", { dateFormat: "Y-m-d" });
    }
  }
  function stub(){
    const report = document.getElementById("report");
    report.textContent = "UI ready. Business logic will appear here in the next step.";
  }
  document.addEventListener("DOMContentLoaded", () => {
    initDatePicker();
    document.getElementById("calcBtn")?.addEventListener("click", stub);
  });
})();
