import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  FaBarcode,
  FaCamera,
  FaSearch,
  FaUser,
  FaPhone,
  FaUtensils,
  FaCalendarAlt,
  FaMinus,
  FaPlus,
  FaSave,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaStop,
} from "react-icons/fa";
import { saveDailyEntry, getEntriesByDate } from "../services/dailyEntryService";
import CustomerBarcodeModal from "../components/CustomerBarcodeModal";
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api";const getDateKey = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};
const createEmptyEntry = () => ({
  breakfastQty: 0,
  lunchQty: 0,
  dinnerQty: 0,
  extraItems: [],
  remark: "",
});
const BarcodeEntry = () => {
  const [barcode, setBarcode] = useState("");
  const lastScannedBarcodeRef = useRef("");
  const lastScanTimeRef = useRef(0);
  const [customer, setCustomer] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [meal, setMeal] = useState("Lunch");
  const [quantity, setQuantity] = useState(1);
  const [extraItems, setExtraItems] = useState([]);
  const [remark, setRemark] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [scannerActive, setScannerActive] = useState(false);
  const [hardwareScannerActive, setHardwareScannerActive] = useState(false);
  const barcodeInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [cameraError, setCameraError] = useState("");
const [saved, setSaved] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);const [showAllBarcodeModal, setShowAllBarcodeModal] = useState(false);const [activeBarcodeCustomers, setActiveBarcodeCustomers] = useState([]);const [loadingAllBarcodes, setLoadingAllBarcodes] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const scanHandledRef = useRef(false);  const stopScanner = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch (error) {
      console.debug("ZXing scanner stop warning:", error);
    }
    try {
      if (readerRef.current?.reset) {
        readerRef.current.reset();
      }
    } catch (error) {
      console.debug("ZXing reader reset warning:", error);
    }
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.debug("Camera track stop warning:", error);
          }
        });
        cameraStreamRef.current = null;
      }
    } catch (error) {
      console.debug("Camera stream stop warning:", error);
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (error) {
        console.debug("Video pause warning:", error);
      }
      try {
        videoRef.current.srcObject = null;
      } catch (error) {
        console.debug("Video source cleanup warning:", error);
      }
    }
    scanHandledRef.current = false;
    setScannerActive(false);
  };
  useEffect(() => {
    return () => {
      stopScanner();
      if (beepAudioContextRef.current) {
        beepAudioContextRef.current.close().catch(() => {});
        beepAudioContextRef.current = null;
      }
    };
  }, []);
  const loadActiveBarcodeCustomers = async () => {
  setLoadingAllBarcodes(true);
  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch(
      `${API_BASE}/barcodes/customers/active`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(
        data?.message || "Could not load active customer barcodes."
      );
    }
    const items = Array.isArray(data.items)
      ? data.items
      : [];
    const customers = items
      .map((item) => {
        const customerData = item?.customer || {};
        return {
          ...customerData,
          barcode:
            item?.barcode ||
            customerData?.barcode ||
            "",
        };
      })
      .filter((item) => item?.barcode);
    setActiveBarcodeCustomers(customers);
    setShowAllBarcodeModal(true);
  } catch (error) {
    console.error(
      "Load active barcode customers error:",
      error
    );
    alert(
      error?.message ||
        "Unable to load active customer barcodes."
    );
  } finally {
    setLoadingAllBarcodes(false);
  }
};const loadExistingEntry = async (customerId, selectedDate) => {
    if (!customerId || !selectedDate) return;
    setLoadingExisting(true);
    try {
      // IMPORTANT:
      // getEntriesByDate expects ONLY the date.
      const response = await getEntriesByDate(selectedDate);
      const entries =
        response?.data ||
        response?.entries ||
        response ||
        [];
      const list = Array.isArray(entries)
        ? entries
        : [];
      const existing = list.find((item) => {
        const itemCustomerId =
          item?.customer?._id ||
          item?.customer ||
          item?.customerId;
        return (
          String(itemCustomerId) ===
          String(customerId)
        );
      });
      if (existing) {
        const normalizedEntry = {
          ...existing,
          breakfastQty: Number(
            existing.breakfastQty || 0
          ),
          lunchQty: Number(
            existing.lunchQty || 0
          ),
          dinnerQty: Number(
            existing.dinnerQty || 0
          ),
          extraItems: Array.isArray(
            existing.extraItems
          )
            ? existing.extraItems.map((item) => ({
                description:
                  item?.description || "",
                amount: Number(
                  item?.amount || 0
                ),
              }))
            : [],
          remark: existing.remark || "",
        };
        setExistingEntry(normalizedEntry);
        setExtraItems(
          normalizedEntry.extraItems
        );
        setRemark(
          normalizedEntry.remark
        );
        // Show the quantity of the currently
        // selected meal.
        const currentMealQty =
          meal === "Breakfast"
            ? normalizedEntry.breakfastQty
            : meal === "Lunch"
              ? normalizedEntry.lunchQty
              : normalizedEntry.dinnerQty;
        setQuantity(
          Math.max(
            1,
            currentMealQty || 1
          )
        );
      } else {
        setExistingEntry(null);
        setExtraItems([]);
        setRemark("");
        setQuantity(1);
      }
    } catch (error) {
      console.error(
        "Load existing daily entry error:",
        error
      );
      // Do not block a new entry if history
      // cannot be loaded.
      setExistingEntry(null);
      setExtraItems([]);
      setRemark("");
      setQuantity(1);
    } finally {
      setLoadingExisting(false);
    }
  };
  const lookupBarcode = async (value) => {
    const clean = String(value || "").trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setCameraError("");
    setSaved(false);
    try {
      const response = await fetch(
        `${API_BASE}/barcodes/lookup/${encodeURIComponent(clean)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Customer not found");
      }
      const foundCustomer =
        data?.customer || data?.data || data;
      setCustomer(foundCustomer);
      setBarcode(clean);
      await loadExistingEntry(foundCustomer?._id, date);
      setShowEntryModal(true);
    } catch (error) {
      console.error("Barcode lookup error:", error);
      setCustomer(null);
      setExtraItems([]);
      setRemark("");
      setCameraError(
        error?.message || "Customer not found for this barcode."
      );
    } finally {
      setLoading(false);
    }
  };  // ==========================================================
  // BARCODE SCAN BEEP
  // ==========================================================
  const beepAudioContextRef = useRef(null);

  const initBeepContext = async () => {
    try {
      if (!beepAudioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;
        if (!AudioContextClass) {
          return;
        }
        beepAudioContextRef.current =
          new AudioContextClass();
      }
      if (
        beepAudioContextRef.current.state === "suspended"
      ) {
        await beepAudioContextRef.current.resume();
      }
    } catch (error) {
      console.debug(
        "Beep audio initialization warning:",
        error
      );
    }
  };
  const playScanBeep = async () => {
    try {
      const audioContext =
        beepAudioContextRef.current;
      if (!audioContext) {
        return;
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const oscillator =
        audioContext.createOscillator();
      const gain =
        audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
      );
      gain.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(
        0.18,
        audioContext.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.12
      );
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(
        audioContext.currentTime + 0.13
      );
    } catch (error) {
      console.debug(
        "Scan beep warning:",
        error
      );
    }
  };  const startScanner = async () => {
    if (scannerActive) {
      return;
    }
    setCameraError("");
    setSaved(false);
    scanHandledRef.current = false;
    if (!window.isSecureContext) {
      setCameraError(
        "Camera requires HTTPS or localhost. Open OM Tiffin using Chrome/Edge on localhost or an HTTPS address."
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera is not supported by this browser or connection. Please use Chrome or Edge on HTTPS/localhost."
      );
      return;
    }
    try {
      /*
       * First request camera permission directly.
       * This guarantees that the browser camera permission
       * flow starts from the user's button click.
       */
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setScannerActive(true);
      /*
       * Wait until React renders the <video>.
       */
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
      if (!videoRef.current) {
        throw new Error(
          "Camera preview could not be initialized. Please try again."
        );
      }
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch (playError) {
        console.debug(
          "Video play warning:",
          playError?.message || playError
        );
      }
      await initBeepContext();
      /*
       * ZXing decodes directly from the already-authorized
       * camera stream.
       */
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      controlsRef.current = await reader.decodeFromStream(
        stream,
        video,
        async (result, error) => {
          if (!result) {
            if (
              error &&
              error.name !== "NotFoundException"
            ) {
              console.debug(
                "Scanner frame:",
                error.message || error
              );
            }
            return;
          }
          if (scanHandledRef.current) {
            return;
          }
          scanHandledRef.current = true;
          const value =
            result.getText?.() ||
            String(result || "");
          if (!value.trim()) {
            scanHandledRef.current = false;
            return;
          }
          await playScanBeep();
          stopScanner();
          await lookupBarcode(value);
        }
      );
      /*
       * Make sure preview remains active after ZXing starts.
       */
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.debug(
            "Camera preview play warning:",
            playError?.message || playError
          );
        }
      }
    } catch (error) {
      console.error("Camera scanner error:", error);
      /*
       * Always release camera if initialization fails.
       */
      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (trackError) {
              console.debug(
                "Camera track cleanup warning:",
                trackError
              );
            }
          });
          cameraStreamRef.current = null;
        }
      } catch (cleanupError) {
        console.debug(
          "Camera cleanup warning:",
          cleanupError
        );
      }
      setScannerActive(false);
      let message =
        error?.message ||
        "Unable to start camera.";
      if (
        error?.name === "NotAllowedError" ||
        error?.name === "PermissionDeniedError"
      ) {
        message =
          "Camera permission was denied. Please allow camera access in Chrome/Edge and click Start Camera again.";
      }
      if (error?.name === "NotFoundError") {
        message =
          "No camera was found. Please connect or enable a webcam.";
      }
      if (error?.name === "NotReadableError") {
        message =
          "Camera is already being used by another application. Close other camera apps and try again.";
      }
      if (error?.name === "SecurityError") {
        message =
          "Camera access is blocked by browser security. Use HTTPS or localhost.";
      }
      setCameraError(message);
    }
  };
  const activateHardwareScanner = () => {
    setCameraError("");
    setSaved(false);
    setHardwareScannerActive(true);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
      barcodeInputRef.current?.select();
    }, 50);
  };
  const handleHardwareBarcodeKeyDown = async (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const value = String(
      event.currentTarget.value || ""
    ).trim();
    if (!value) {
      return;
    }
    await playScanBeep();
    await lookupBarcode(value);
  };  const handleSearch = async () => {
    await lookupBarcode(barcode);
  };
  const handleDateChange = async (value) => {
    setDate(value);
    setSaved(false);
    if (customer?._id) {
      await loadExistingEntry(customer._id, value);
    }
  };
  const handleMealChange = (value) => {
    setMeal(value);
    setSaved(false);
    if (existingEntry) {
      const currentMealQty =
        value === "Breakfast"
          ? Number(
              existingEntry.breakfastQty || 0
            )
          : value === "Lunch"
            ? Number(
                existingEntry.lunchQty || 0
              )
            : Number(
                existingEntry.dinnerQty || 0
              );
      setQuantity(
        Math.max(
          1,
          currentMealQty || 1
        )
      );
    } else {
      setQuantity(1);
    }
  };
  const decreaseQuantity = () => {
    setQuantity((prev) =>
      Math.max(1, Number(prev || 1) - 1)
    );
    setSaved(false);
  };
  const increaseQuantity = () => {
    setQuantity((prev) =>
      Math.max(1, Number(prev || 1) + 1)
    );
    setSaved(false);
  };
  const handleQuantityChange = (value) => {
    const numericValue = Math.floor(Number(value));
    if (!Number.isFinite(numericValue) || numericValue < 1) {
      setQuantity(1);
    } else {
      setQuantity(numericValue);
    }
    setSaved(false);
  };
  const addExtraItem = () => {
    setExtraItems((prev) => [
      ...prev,
      {
        description: "",
        amount: 0,
      },
    ]);
    setSaved(false);
  };
  const removeExtraItem = (index) => {
    setExtraItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
    setSaved(false);
  };
  const updateExtraItem = (index, field, value) => {
    setExtraItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return {
          ...item,
          [field]:
            field === "amount"
              ? Math.max(0, Number(value) || 0)
              : value,
        };
      })
    );
    setSaved(false);
  };
  const handleSave = async () => {
    if (!customer?._id) {
      setCameraError(
        "Please scan or search a valid customer first."
      );
      return;
    }
    const cleanExtraItems = extraItems
      .map((item) => ({
        description: String(
          item?.description || ""
        ).trim(),
        amount: Math.max(
          0,
          Number(item?.amount || 0)
        ),
      }))
      .filter(
        (item) =>
          item.description.length > 0 ||
          item.amount > 0
      );
    if (
      cleanExtraItems.some(
        (item) => !item.description
      )
    ) {
      setCameraError(
        "Please enter a description for every extra item."
      );
      return;
    }
    const mealQuantity = Math.max(
      1,
      Math.floor(Number(quantity) || 1)
    );
    // IMPORTANT:
    // Preserve already saved quantities for
    // other meals instead of resetting them to 0.
    const previousBreakfastQty = Number(
      existingEntry?.breakfastQty || 0
    );
    const previousLunchQty = Number(
      existingEntry?.lunchQty || 0
    );
    const previousDinnerQty = Number(
      existingEntry?.dinnerQty || 0
    );
    const payload = {
      customer: customer._id,
      date,
      breakfastQty:
        meal === "Breakfast"
          ? mealQuantity
          : previousBreakfastQty,
      lunchQty:
        meal === "Lunch"
          ? mealQuantity
          : previousLunchQty,
      dinnerQty:
        meal === "Dinner"
          ? mealQuantity
          : previousDinnerQty,
      extraItems: cleanExtraItems,
      remark: String(
        remark || ""
      ).trim(),
    };
    setLoading(true);
    setCameraError("");
    try {
      const response =
        await saveDailyEntry(payload);
      // saveDailyEntry returns:
      // { success, message, data }
      const savedEntry =
        response?.data?.data ||
        response?.data ||
        response;
      const normalizedSavedEntry = {
        ...savedEntry,
        breakfastQty: Number(
          savedEntry?.breakfastQty || 0
        ),
        lunchQty: Number(
          savedEntry?.lunchQty || 0
        ),
        dinnerQty: Number(
          savedEntry?.dinnerQty || 0
        ),
        extraItems: Array.isArray(
          savedEntry?.extraItems
        )
          ? savedEntry.extraItems
          : cleanExtraItems,
        remark:
          savedEntry?.remark ||
          String(remark || "").trim(),
      };
      // Keep the freshly saved entry in memory.
      setExistingEntry(
        normalizedSavedEntry
      );
      setExtraItems(
        normalizedSavedEntry.extraItems
      );
      setRemark(
        normalizedSavedEntry.remark
      );
      // Keep current meal quantity visible.
      const savedMealQty =
        meal === "Breakfast"
          ? normalizedSavedEntry.breakfastQty
          : meal === "Lunch"
            ? normalizedSavedEntry.lunchQty
            : normalizedSavedEntry.dinnerQty;
      setQuantity(
        Math.max(
          1,
          savedMealQty || 1
        )
      );
      setSaved(true);
      setShowEntryModal(false);
      resetCustomer();
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      console.log(
        "Daily Entry Saved:",
        normalizedSavedEntry
      );
    } catch (error) {
      console.error(
        "Daily entry save error:",
        error
      );
      setCameraError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save daily entry."
      );
    } finally {
      setLoading(false);
    }
  };
  const resetCustomer = () => {
    stopScanner();
    setCustomer(null);
    setExistingEntry(null);
    setBarcode("");
    setExtraItems([]);
    setRemark("");
    setMeal("Lunch");
    setQuantity(1);
    setSaved(false);
    setCameraError("");
  };
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Barcode Entry
        </h1>
        <p className="text-slate-500 mt-1">
          Scan customer barcode and create Daily Tiffin Entry
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================
            SCANNER
        ========================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <FaBarcode className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                Scan Barcode
              </h2>
              <p className="text-sm text-slate-500">
                Use camera or USB barcode scanner
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"><button
              type="button"
              onClick={
                scannerActive
                  ? stopScanner
                  : startScanner
              }
              className={
                `w-full min-h-[78px] rounded-2xl px-4 py-4 ` +
                `font-bold flex items-center justify-center gap-3 ` +
                `border transition-all duration-200 ` +
                (
                  scannerActive
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md"
                )
              }
            >
              {scannerActive ? (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                    <FaStop className="text-lg" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm sm:text-base">
                      Stop Camera
                    </span>
                    <span className="block text-xs font-normal opacity-80">
                      Camera is active
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <FaCamera className="text-lg" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm sm:text-base">
                      Mobile Camera Scanner
                    </span>
                    <span className="block text-xs font-normal opacity-80">
                      Tap to activate camera
                    </span>
                  </span>
                </>
              )}
            </button>

          <button
            type="button"
            onClick={activateHardwareScanner}
            className="w-full min-h-[78px] rounded-2xl px-4 py-4 flex items-center justify-center gap-3 font-bold border border-slate-700 bg-slate-800 text-white hover:bg-slate-900 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <FaBarcode className="text-lg" />
            </span>
            <span className="text-left">
              <span className="block text-sm sm:text-base">
                USB Hardware Scanner
              </span>
              <span className="block text-xs font-normal text-slate-300">
                Scan barcode with USB device
              </span>
            </span>
          </button>
          </div>
          {scannerActive && (
            <div className="mb-4 overflow-hidden rounded-2xl border-2 border-blue-500 bg-black shadow-lg">
              <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                  <span className="text-sm font-bold">
                    Camera Scanner Active
                  </span>
                </div>
                <span className="text-xs opacity-90">
                  Point at barcode
                </span>
              </div>
              <video
                ref={videoRef}
                className="w-full aspect-[4/3] sm:aspect-video object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="bg-slate-950 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-white">
                Hold the barcode steady inside the camera view
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-bold text-slate-400">
              OR ENTER MANUALLY
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
                    <div className="w-full min-w-0">
            {hardwareScannerActive && (
              <div className="mb-3 w-full min-w-0 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FaBarcode />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-800">
                      USB Scanner Active
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Scan barcode with USB scanner and press Enter.
                  </p>
                </div>
              </div>
            )}
            <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_52px] gap-2 sm:gap-3 items-center">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) =>
                  setBarcode(e.target.value.toUpperCase())
                }
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    if (hardwareScannerActive) {
                      await handleHardwareBarcodeKeyDown(e);
                    } else {
                      await handleSearch();
                    }
                  }
                }}
                placeholder="OMT-XXXXXX"
                className="w-full min-w-0 h-12 border border-slate-300 rounded-xl px-4 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="w-[52px] h-12 shrink-0 rounded-xl bg-slate-800 text-white hover:bg-slate-900 flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <FaSearch />
              </button>
            </div>
          </div>          {cameraError && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {cameraError}
            </div>
          )}
        </div>
        {/* =========================================
            CUSTOMER + ENTRY
        ========================================= */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <FaUser className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                      {/* PRINT ALL ACTIVE CUSTOMER BARCODES */}
      <div className="mt-5">
        <button
          type="button"
          onClick={loadActiveBarcodeCustomers}
          disabled={loadingAllBarcodes}
          className="w-full py-3 rounded-xl border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <FaBarcode />
          {loadingAllBarcodes
            ? "Loading Active Customer Barcodes..."
            : "Print All Active Customer Barcodes"}
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Print all active customer barcode stickers in one print job.
        </p>
      </div>
Customer Details
              </h2>
              <p className="text-sm text-slate-500">
                Selected customer
              </p>
            </div>
          </div>
          {!customer ? (
            <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-300 p-6 sm:p-8 text-center w-full min-w-0 overflow-hidden">
              <FaBarcode className="mx-auto text-4xl text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">
                No customer selected
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Scan a customer barcode to continue
              </p>
            </div>
          ) : (
            <div
              className={
                showEntryModal
                  ? "fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 p-3 sm:p-6"
                  : "hidden"
              }
            >
              <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden mb-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">
                      Customer Daily Entry
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Complete the tiffin entry and press Next
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEntryModal(false);
                      resetCustomer();
                      setTimeout(() => {
                        barcodeInputRef.current?.focus();
                      }, 100);
                    }}
                    className="shrink-0 h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xl flex items-center justify-center"
                    aria-label="Close daily entry"
                  >
                    ×
                  </button>
                </div>
                <div className="p-3 sm:p-6">              {/* CUSTOMER */}
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-green-600 font-bold uppercase">
                      Customer
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {customer.customerName ||
                        customer.name ||
                        "-"}
                    </div>
                  </div>
                  <FaCheckCircle className="text-green-600 text-2xl shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-3 text-slate-600">
                  <FaPhone />
                  {customer.phone || "-"}
                </div>
                {customer.address && (
                  <div className="mt-2 text-sm text-slate-600">
                    Address: {customer.address}
                  </div>
                )}
                <div className="mt-3 inline-flex items-center rounded-lg bg-white border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                  {barcode}
                </div>
              </div>
              {/* DATE + MEAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <FaCalendarAlt className="inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      handleDateChange(e.target.value)
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <FaUtensils className="inline mr-2" />
                    Meal
                  </label>
                  <select
                    value={meal}
                    onChange={(e) =>
                      handleMealChange(e.target.value)
                    }
                    className="w-full border border-slate-300 rounded-xl px-3 py-3"
                  >
                    <option value="Breakfast">
                      Breakfast
                    </option>
                    <option value="Lunch">
                      Lunch
                    </option>
                    <option value="Dinner">
                      Dinner
                    </option>
                  </select>
                </div>
              </div>
              {/* QUANTITY */}
              <div className="mt-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tiffin Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={loading}
                    className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <FaMinus />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(e.target.value)
                    }
                    className="w-24 h-11 text-center border border-slate-300 rounded-xl font-bold text-lg"
                  />
                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={loading}
                    className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <FaPlus />
                  </button>
                  <span className="text-sm text-slate-500">
                    {meal} tiffin
                  </span>
                </div>
              </div>
              {/* EXISTING ENTRY INFO */}
              {loadingExisting && (
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 p-3 text-sm">
                  Loading existing entry for this date...
                </div>
              )}
              {/* EXTRA ITEMS */}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Extra Items
                    <span className="font-normal text-slate-500">
                      {" "}(Optional)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={addExtraItem}
                    disabled={loading}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <FaPlus className="text-xs" />
                    Add Extra Item
                  </button>
                </div>
                {extraItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-400 text-center">
                    No extra items added
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extraItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(0,1fr)_90px_42px] gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={item.description || ""}
                          onChange={(e) =>
                            updateExtraItem(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Extra item description"
                          className="w-full border border-slate-300 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount ?? 0}
                          onChange={(e) =>
                            updateExtraItem(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="Amount"
                          className="w-full border border-slate-300 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeExtraItem(index)
                          }
                          disabled={loading}
                          title="Remove extra item"
                          className="w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center justify-center disabled:opacity-50"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Same format as Daily Entry: description + amount.
                </p>
              </div>
              {/* REMARK */}
              <div className="mt-5">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Remark
                </label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => {
                    setRemark(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Optional remark"
                  className="w-full border border-slate-300 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                 </div>
              </div>             </div>          {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    loading ||
                    loadingExisting ||
                    saved
                  }
                  className={
                    `flex-1 py-3 rounded-xl font-bold ` +
                    `flex items-center justify-center gap-2 ` +
                    (
                      saved
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    ) +
                    " disabled:opacity-70"
                  }
                >
                  {saved ? (
                    <>
                      <FaCheckCircle />
                      Entry Saved
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {loading
                        ? "Saving..."
                        : "Next"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetCustomer}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FaTimes />
                  Clear
                </button>
              </div>
            </div>
          )}
        {showAllBarcodeModal && (
          <CustomerBarcodeModal
            customer={null}
            customers={activeBarcodeCustomers}
            onClose={() => setShowAllBarcodeModal(false)}
          />
        )}
        </div>
      </div>
    </div>
  );
};
export default BarcodeEntry;



































