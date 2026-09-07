import React, { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const makeBarcodeValue = (customer) => {
  if (!customer) return "";
  if (customer.barcode) {
    return String(customer.barcode).toUpperCase();
  }
  const id = customer._id || customer.id || "";
  const cleanId = String(id)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return `OMT-${cleanId || "000001"}`;
};
const CustomerBarcodeModal = ({
  customer = null,
  customers = [],
  onClose,
}) => {
  const [copies, setCopies] = useState(1);
  const [printingAll, setPrintingAll] = useState(false);
  const singleBarcodeRef = useRef(null);
  const [resolvedBarcode, setResolvedBarcode] = useState("");
  const activeCustomers = useMemo(
    () =>
      (customers || []).filter(
        (item) =>
          String(item?.status || "Active").toLowerCase() === "active"
      ),
    [customers]
  );
  const isAllMode = !customer && activeCustomers.length > 0;
  useEffect(() => {
    let cancelled = false;
    const loadRealBarcode = async () => {
      if (!customer?._id) {
        if (!cancelled) {
          setResolvedBarcode("");
        }
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE}/barcodes/customer/${encodeURIComponent(customer._id)}`
        );
        if (!response.ok) {
          throw new Error("Unable to load customer barcode");
        }
        const data = await response.json();
        const value =
          data?.barcode ||
          data?.customer?.barcode ||
          "";
        if (!cancelled) {
          setResolvedBarcode(
            String(value || "").toUpperCase()
          );
        }
      } catch (error) {
        console.error("Customer barcode load error:", error);
        if (!cancelled) {
          setResolvedBarcode(
            String(customer?.barcode || "").toUpperCase()
          );
        }
      }
    };
    loadRealBarcode();

return () => {
      cancelled = true;
    };
  }, [customer?._id, customer?.barcode]);  useEffect(() => {
    if (customer && singleBarcodeRef.current) {
      singleBarcodeRef.current.innerHTML = "";
      JsBarcode(
        singleBarcodeRef.current,
        makeBarcodeValue(customer),
        {
          format: "CODE128",
          width: 2,
          height: 48,
          displayValue: true,
          fontSize: 11,
          fontOptions: "bold",
          margin: 4,
          background: "#ffffff",
          lineColor: "#000000",
        }
      );
    }
  }, [customer]);
  useEffect(() => {
    if (printingAll && activeCustomers.length > 0) {
      const timer = setTimeout(() => {
        document.title = "OM Tiffin Service - Customer Barcode Stickers";
        window.print();
        setTimeout(() => {
          setPrintingAll(false);
        }, 500);
      }, 400);

return () => clearTimeout(timer);
    }
  }, [printingAll, activeCustomers.length]);
  if (!customer && !isAllMode) return null;
  const printSticker = async () => {
    if (!customer) return;
    const value =
      resolvedBarcode ||
      makeBarcodeValue(customer);
    const copiesNumber = Math.max(
      1,
      Math.min(50, Number(copies) || 1)
    );
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );
    if (!printWindow) {
      alert(
        "Please allow pop-ups to print the barcode sticker."
      );
      return;
    }
    const customerNameForPrint =
      customer?.customerName ||
      customer?.name ||
      "Customer";
    const phoneForPrint =
      customer?.phone ||
      "";
    const addressForPrint =
      customer?.address ||
      "";
    const stickers = Array.from(
      { length: copiesNumber },
      () => `
        <div class="sticker">
          <div class="brand">
            OM TIFFIN SERVICE
          </div>
          <div class="subbrand">
            TIFFIN SERVICE
          </div>
          <div class="customer">
            ${customerNameForPrint}
          </div>
          ${
            phoneForPrint
              ? `<div class="line">Phone: ${phoneForPrint}</div>`
              : ""
          }
          ${
            addressForPrint
              ? `<div class="line address">${addressForPrint}</div>`
              : ""
          }
          <svg class="barcode"></svg>
          <div class="barcode-value">
            ${value}
          </div>
          <div class="footer">
            Scan for Daily Tiffin Entry
          </div>
        </div>
      `
    ).join("");
    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>OM Tiffin Barcode Sticker</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
          }
          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Arial, sans-serif;
          }
          .sheet {
            display: flex;
            flex-wrap: wrap;
            gap: 8mm;
            align-items: flex-start;
          }
          .sticker {
            width: 85mm;
            min-height: 45mm;
            border: 0.4mm solid #777;
            border-radius: 2mm;
            padding: 3mm 4mm 2mm;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            background: #fff;
          }
          .brand {
            font-size: 13pt;
            font-weight: 800;
            letter-spacing: 0.2mm;
          }
          .subbrand {
            font-size: 6.5pt;
            color: #666;
            letter-spacing: 0.5mm;
            margin-top: 0.5mm;
          }
          .customer {
            font-size: 10pt;
            font-weight: 700;
            margin-top: 2mm;
            border-top: 0.25mm solid #ddd;
            padding-top: 1.5mm;
          }
          .line {
            font-size: 7pt;
            margin-top: 1mm;
            color: #333;
          }
          .address {
            max-width: 75mm;
            margin-left: auto;
            margin-right: auto;
          }
          .barcode {
            width: 76mm;
            height: 18mm;
            margin: 2mm auto 0;
            display: block;
          }
          .barcode-value {
            font-family: monospace;
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.4mm;
            margin-top: 0.5mm;
          }
          .footer {
            border-top: 0.25mm dashed #aaa;
            margin-top: 1.5mm;
            padding-top: 1mm;
            font-size: 5.5pt;
            color: #666;
          }
          @media print {
            .sticker {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${stickers}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    const barcodeNodes =
      printWindow.document.querySelectorAll(".barcode");
    barcodeNodes.forEach((node) => {
      JsBarcode(node, value, {
        format: "CODE128",
        width: 1.7,
        height: 55,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    });
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 300);
  };
  const customerName =
    customer?.customerName ||
    customer?.name ||
    "Customer";
  const phone = customer?.phone || "";
  const address = customer?.address || "";
  const barcodeValue = customer
    ? makeBarcodeValue(customer)
    : "";
  const handlePrintSingle = () => {
    window.print();
  };
  const handlePrintAll = async () => {
    if (!activeCustomers.length) {
      alert("No active customers found.");
      return;
    }
    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=900"
    );
    if (!printWindow) {
      alert("Please allow pop-ups for barcode printing.");
      return;
    }
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const createBarcodeSvg = (value) => {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      try {
        JsBarcode(svg, value, {
          format: "CODE128",
          displayValue: false,
          height: 55,
          width: 1.5,
          margin: 0,
          background: "#ffffff",
          lineColor: "#111111",
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
      return svg.outerHTML;
    };
    const stickersHtml = activeCustomers
      .map((item) => {
        const name =
          item?.customerName ||
          item?.name ||
          "Customer";
        const phone = item?.phone || "";
        const value = makeBarcodeValue(item);
        return `
          <div class="sticker">
            <div class="customer-name">
              ${escapeHtml(name)}
            </div>
            ${
              phone
                ? `<div class="customer-phone">${escapeHtml(phone)}</div>`
                : ""
            }
            <div class="barcode">
              ${createBarcodeSvg(value)}
            </div>
            <div class="barcode-code">
              ${escapeHtml(value)}
            </div>
          </div>
        `;
      })
      .join("");
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OM Tiffin Service - Customer Barcode Stickers</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm;
            }
            * {
              box-sizing: border-box;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
            }
            .sheet {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 3mm;
              align-items: start;
            }
            .sticker {
              width: 100%;
              min-height: 31mm;
              border: 0.3mm solid #111111;
              border-radius: 1.5mm;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .customer-name {
              font-size: 11pt;
              font-weight: 700;
              line-height: 1.1;
              word-break: break-word;
            }
            .customer-phone {
              margin-top: 0.8mm;
              font-size: 8pt;
              color: #444444;
              line-height: 1.1;
            }
            .barcode {
              width: 100%;
              margin-top: 1.5mm;
            }
            .barcode svg {
              width: 100%;
              height: 15mm;
              display: block;
            }
            .barcode-code {
              margin-top: 0.8mm;
              font-size: 8pt;
              font-weight: 700;
              text-align: center;
              letter-spacing: 0.2mm;
            }
            @media print {
              html,
              body {
                width: 210mm;
              }
              .sticker {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${stickersHtml}
          </div>
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 500);
            });
            window.addEventListener("afterprint", function () {
              setTimeout(function () {
                window.close();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const sticker = (item, index) => {
    const name =
      item?.customerName ||
      item?.name ||
      "Customer";
    const itemPhone = item?.phone || "";
    const itemAddress = item?.address || "";
    const value = makeBarcodeValue(item);

return (
      <div
        key={item?._id || item?.id || `${value}-${index}`}
        className="om-barcode-sticker"
      >
        <div className="sticker-header">
          <div className="brand-name">
            OM TIFFIN SERVICE
          </div>
          <div className="brand-subtitle">
            TIFFIN SERVICE
          </div>
        </div>
        <div className="sticker-body">
          <div className="customer-name">
            {name}
          </div>
          {itemPhone && (
            <div className="customer-line">
              {itemPhone}
            </div>
          )}
          {itemAddress && (
            <div className="customer-line address-line">
              {itemAddress}
            </div>
          )}
          <svg
            className="barcode-svg"
            ref={(node) => {
              if (node) {
                JsBarcode(node, value, {
                  format: "CODE128",
                  width: 1.8,
                  height: 42,
                  displayValue: true,
                  fontSize: 9,
                  fontOptions: "bold",
                  margin: 2,
                  background: "#ffffff",
                  lineColor: "#000000",
                });
              }
            }}
          />
          <div className="barcode-id">
            {value}
          </div>
        </div>
        <div className="sticker-footer">
          Scan for Daily Tiffin Entry
        </div>
      </div>
    );
  };

return (
    <>
      <style>
        {`
          @media screen {
            .barcode-modal-overlay {
              position: fixed;
              inset: 0;
              z-index: 99999;
              background: rgba(15, 23, 42, 0.72);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .barcode-modal {
              width: min(1050px, 96vw);
              max-height: 92vh;
              overflow: auto;
              background: white;
              border-radius: 18px;
              box-shadow: 0 30px 80px rgba(0,0,0,.35);
            }
            .barcode-modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 18px 22px;
              border-bottom: 1px solid #e5e7eb;
            }
            .barcode-modal-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .barcode-modal-actions {
              display: flex;
              gap: 10px;
              align-items: center;
              flex-wrap: wrap;
            }
            .barcode-btn {
              border: 0;
              border-radius: 10px;
              padding: 10px 15px;
              font-weight: 700;
              cursor: pointer;
            }
            .barcode-btn-print {
              background: #1d4ed8;
              color: white;
            }
            .barcode-btn-all {
              background: #059669;
              color: white;
            }
            .barcode-btn-close {
              background: #e5e7eb;
              color: #111827;
            }
            .barcode-preview {
              padding: 24px;
              background: #f1f5f9;
            }
            .single-preview {
              display: flex;
              justify-content: center;
            }
            .barcode-sheet {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              background: white;
              padding: 10px;
              width: 100%;
            }
            .barcode-sticker {
              width: 100%;
              min-height: 145px;
              border: 1px solid #9ca3af;
              border-radius: 8px;
              background: #ffffff;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sticker-header {
              text-align: center;
              padding: 5px 6px 3px;
              border-bottom: 1px solid #d1d5db;
            }
            .brand-name {
              font-size: 10px;
              font-weight: 900;
              letter-spacing: .5px;
              color: #111827;
            }
            .brand-subtitle {
              font-size: 6px;
              font-weight: 700;
              letter-spacing: 1px;
              color: #6b7280;
            }
            .sticker-body {
              text-align: center;
              padding: 4px 7px;
              flex: 1;
            }
            .customer-name {
              font-size: 10px;
              font-weight: 800;
              color: #111827;
              margin-bottom: 2px;
            }
            .customer-line {
              font-size: 7px;
              line-height: 10px;
              color: #374151;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .address-line {
              max-width: 100%;
            }
            .barcode-svg {
              display: block;
              width: 100%;
              max-width: 180px;
              height: 48px;
              margin: 2px auto 0;
            }
            .barcode-id {
              font-size: 7px;
              font-weight: 800;
              letter-spacing: .6px;
              color: #111827;
            }
            .sticker-footer {
              text-align: center;
              font-size: 6px;
              font-weight: 700;
              color: #6b7280;
              padding: 3px;
              border-top: 1px dashed #d1d5db;
            }
            .copies-box {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              font-weight: 700;
            }
            .copies-box input {
              width: 58px;
              padding: 7px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              text-align: center;
            }
            .single-sticker {
              width: 360px;
            }
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            body * {
              visibility: hidden !important;
            }
            .barcode-modal-overlay,
            .barcode-modal-overlay * {
              visibility: visible !important;
            }
            .barcode-modal-overlay {
              position: static !important;
              display: block !important;
              background: white !important;
              padding: 0 !important;
            }
            .barcode-modal {
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
            .barcode-modal-header {
              display: none !important;
            }
            .barcode-preview {
              padding: 0 !important;
              background: white !important;
            }
            .single-preview {
              display: block !important;
            }
            .single-sticker {
              width: 70mm !important;
              margin: 0 auto !important;
            }
            .barcode-sheet {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 3mm !important;
              padding: 0 !important;
              width: 100% !important;
              background: white !important;
            }
            .barcode-sticker {
              min-height: 43mm !important;
              border: .25mm solid #444 !important;
              border-radius: 2mm !important;
            }
            .copies-box {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="barcode-modal-overlay">
        <div className="barcode-modal">
          <div className="barcode-modal-header">
            <div>
              <div className="barcode-modal-title">
                {isAllMode
                  ? `Print All Customer Stickers (${activeCustomers.length})`
                  : "Customer Barcode Sticker"}
              </div>
              {!isAllMode && (
                <div style={{
                  marginTop: 4,
                  color: "#64748b",
                  fontSize: 12
                }}>
                  {customerName} {phone ? `- ${phone}` : ""}
                </div>
              )}
            </div>
            <div className="barcode-modal-actions">
              {!isAllMode && (
                <div className="copies-box">
                  Copies
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={copies}
                    onChange={(e) => {
                      const value = Math.max(
                        1,
                        Math.min(50, Number(e.target.value) || 1)
                      );
                      setCopies(value);
                    }}
                  />
                </div>
              )}
              {!isAllMode && (
                <button
                  type="button"
                  className="barcode-btn barcode-btn-print"
                  onClick={printSticker}
                >
                  Print Sticker
                </button>
              )}
              {isAllMode && (
                <button
                  type="button"
                  className="barcode-btn barcode-btn-all"
                  onClick={handlePrintAll}
                  disabled={printingAll}
                >
                  {printingAll ? "Preparing..." : "Print All Stickers"}
                </button>
              )}
              <button
                type="button"
                className="barcode-btn barcode-btn-close"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
          <div className="barcode-preview">
            {!isAllMode && customer && (
              <div className="single-preview">
                <div className="single-sticker">
                  <div className="om-barcode-sticker">
                    <div className="sticker-header">
                      <div className="brand-name">
                        OM TIFFIN SERVICE
                      </div>
                      <div className="brand-subtitle">
                        TIFFIN SERVICE
                      </div>
                    </div>
                    <div className="sticker-body">
                      <div className="customer-name">
                        {customerName}
                      </div>
                      {phone && (
                        <div className="customer-line">
                          {phone}
                        </div>
                      )}
                      {address && (
                        <div className="customer-line address-line">
                          {address}
                        </div>
                      )}
                      <svg ref={singleBarcodeRef} />
                      <div className="barcode-id">
                        {barcodeValue}
                      </div>
                    </div>
                    <div className="sticker-footer">
                      Scan for Daily Tiffin Entry
                    </div>
                  </div>
                  {copies > 1 &&
                    Array.from({
                      length: copies - 1
                    }).map((_, index) => (
                      <div
                        key={`copy-${index}`}
                        className="om-barcode-sticker"
                        style={{
                          marginTop: 10
                        }}
                      >
                        <div className="sticker-header">
                          <div className="brand-name">
                            OM TIFFIN SERVICE
                          </div>
                          <div className="brand-subtitle">
                            TIFFIN SERVICE
                          </div>
                        </div>
                        <div className="sticker-body">
                          <div className="customer-name">
                            {customerName}
                          </div>
                          {phone && (
                            <div className="customer-line">
                              {phone}
                            </div>
                          )}
                          {address && (
                            <div className="customer-line address-line">
                              {address}
                            </div>
                          )}
                          <svg
                            className="barcode-svg"
                            ref={(node) => {
                              if (node) {
                                JsBarcode(
                                  node,
                                  barcodeValue,
                                  {
                                    format: "CODE128",
                                    width: 1.8,
                                    height: 42,
                                    displayValue: true,
                                    fontSize: 9,
                                    fontOptions: "bold",
                                    margin: 2,
                                    background: "#ffffff",
                                    lineColor: "#000000",
                                  }
                                );
                              }
                            }}
                          />
                          <div className="barcode-id">
                            {barcodeValue}
                          </div>
                        </div>
                        <div className="sticker-footer">
                          Scan for Daily Tiffin Entry
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            {isAllMode && (
              <div className="barcode-sheet">
                {activeCustomers.map(sticker)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default CustomerBarcodeModal;











