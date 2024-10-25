if (typeof window.notificationRemoverObserver === "undefined") {
  window.notificationRemoverObserver = new MutationObserver(() => {
    if (window.removeNotifsEnabled) {
      removeNotificationsNumber();
    }
  });

  window.removeNotifsEnabled = false;

  function initNotificationRemover() {
    browser.runtime.sendMessage({ method: "getOptions" }).then((response) => {
      window.removeNotifsEnabled = response.removeNotifs;

      if (window.removeNotifsEnabled) {
        removeNotificationsNumber();

        window.notificationRemoverObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  function removeNotificationsNumber() {
    const notificationsNumber = document.getElementById("notificationsNumber");

    if (notificationsNumber) {
      notificationsNumber.parentNode.removeChild(notificationsNumber);
    } else {
      requestAnimationFrame(() => {
        const retryNotification = document.getElementById(
          "notificationsNumber"
        );
        if (retryNotification) {
          retryNotification.parentNode.removeChild(retryNotification);
        }
      });
    }
  }

  window.addEventListener("popstate", () => {
    if (window.removeNotifsEnabled) {
      removeNotificationsNumber();
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      if (window.removeNotifsEnabled) {
        setTimeout(removeNotificationsNumber, 100);
      }
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotificationRemover);
  } else {
    initNotificationRemover();
  }
}
