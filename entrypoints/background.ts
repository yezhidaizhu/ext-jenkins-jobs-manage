export default defineBackground(() => {
  if (browser.sidePanel?.setPanelBehavior) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
