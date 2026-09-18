import { useEffect } from "react";
const DEFAULT_INTERVAL = 5 * 60 * 1000;
const useCustomerAutoRefresh = (refreshCallback, interval = DEFAULT_INTERVAL) => {
  useEffect(() => {
    if (typeof refreshCallback !== "function") {
      return undefined;
    }
    const runRefresh = () => {
      refreshCallback();
    };
    const timer = setInterval(runRefresh, interval);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runRefresh();
      }
    };
    window.addEventListener("focus", runRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", runRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCallback, interval]);
};
export default useCustomerAutoRefresh;
