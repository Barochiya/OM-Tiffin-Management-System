const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const EXTRA_ICON_DIR = path.join(__dirname, "../assets/pdf-extra-icons");
const LOGO_PATH = path.join(
  __dirname,
  "../../frontend/src/assets/logo.png"
);const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `Rs.${amount.toFixed(2)}`;
};
const safe = (value, fallback = "-") => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
};
const generateBillPdf = async (bill, customer) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        bufferPages: true,
        autoFirstPage: true,
      });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("error", reject);
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
      const PAGE_WIDTH = doc.page.width;
      const PAGE_HEIGHT = doc.page.height;
      const LEFT = 36;
      const RIGHT = PAGE_WIDTH - 36;
      const CONTENT_WIDTH = RIGHT - LEFT;
      const BOTTOM_SAFE = PAGE_HEIGHT - 48;
      const colors = {
        primary: "#1d4ed8",
        primaryDark: "#1e40af",
        text: "#111827",
        muted: "#6b7280",
        border: "#d1d5db",
        borderLight: "#e5e7eb",
        green: "#15803d",
        greenBg: "#f0fdf4",
        blueBg: "#eff6ff",
        red: "#dc2626",
        yellowBg: "#fffbeb",
        yellowBorder: "#fcd34d",
        white: "#ffffff",
        tableHeader: "#1d4ed8",
        tableAlt: "#f8fafc",
      };
      // =========================================================
      // BASIC HELPERS
      // =========================================================
      const drawLine = (
        y,
        x1 = LEFT,
        x2 = RIGHT,
        color = colors.border,
        width = 0.8
      ) => {
        doc
          .moveTo(x1, y)
          .lineTo(x2, y)
          .strokeColor(color)
          .lineWidth(width)
          .stroke();
      };
      const drawRoundedBox = (
        x,
        y,
        width,
        height,
        fill = colors.white,
        stroke = colors.border
      ) => {
        doc
          .roundedRect(x, y, width, height, 8)
          .fillAndStroke(fill, stroke);
      };
      const drawSectionTitle = (text) => {
        const y = doc.y;
        doc
          .font("Helvetica-Bold")
          .fontSize(13)
          .fillColor(colors.text)
          .text(text, LEFT, y);
        doc.y = y + 21;
      };
      const pageBreak = (requiredHeight = 0) => {
        if (doc.y + requiredHeight > BOTTOM_SAFE) {
          doc.addPage();
          doc.y = 42;
          return true;
        }
        return false;
      };
      const getExtraItems = (day) => {
        return Array.isArray(day?.extraItems)
          ? day.extraItems
          : [];
      };
      const getDateText = (dateValue) => {
        if (!dateValue) return "-";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
          return "-";
        }
        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      };
      const getMealCell = (qty, amount) => {
        const quantity = Number(qty || 0);
        if (quantity <= 0) {
          return "-";
        }
        const totalAmount = Number(amount || 0);
        const rate = totalAmount / quantity;
        return `${quantity} x ${formatMoney(rate)}`;
      };
      const getExtraItemSymbol = (description = "") => {
        const name = String(description).toLowerCase().trim();
        if (
          name.includes("roti") ||
          name.includes("rotli") ||
          name.includes("chapati") ||
          name.includes("paratha")
        ) {
          return "🫓";
        }
        if (
          name.includes("dal") ||
          name.includes("daal")
        ) {
          return "🍲";
        }
        if (
          name.includes("rice") ||
          name.includes("chawal") ||
          name.includes("bhaat")
        ) {
          return "🍚";
        }
        if (
          name.includes("sabji") ||
          name.includes("sabzi") ||
          name.includes("vegetable")
        ) {
          return "🥗";
        }
        if (
          name.includes("curd") ||
          name.includes("dahi")
        ) {
          return "🥣";
        }
        return "🍽️";
      };      const getExtraIconPath = (description = "") => {
        const name = String(description).toLowerCase().trim();
        if (
          name.includes("roti") ||
          name.includes("rotli") ||
          name.includes("chapati") ||
          name.includes("paratha")
        ) {
          return path.join(EXTRA_ICON_DIR, "roti.png");
        }
        if (
          name.includes("dal") ||
          name.includes("daal")
        ) {
          return path.join(EXTRA_ICON_DIR, "dal.png");
        }
        if (
          name.includes("rice") ||
          name.includes("chawal") ||
          name.includes("bhaat")
        ) {
          return path.join(EXTRA_ICON_DIR, "rice.png");
        }
        if (
          name.includes("sabji") ||
          name.includes("sabzi") ||
          name.includes("vegetable")
        ) {
          return path.join(EXTRA_ICON_DIR, "sabji.png");
        }
        if (
          name.includes("curd") ||
          name.includes("dahi")
        ) {
          return path.join(EXTRA_ICON_DIR, "curd.png");
        }
        return path.join(EXTRA_ICON_DIR, "extra.png");
      };      const getExtraText = (items) => {
        if (!items.length) {
          return "-";
        }
        return items
          .map((item) => {
            const description = safe(item?.description, "Item").replace(/^Extra\s+/i, "").trim();
            const amount = Number(item?.amount || 0);
            return `+ ${getExtraItemSymbol(description)} ${description}   ${formatMoney(amount)}`;
          })
          .join("\n");
      };
      // =========================================================
      // HEADER
      // =========================================================
      const drawHeader = () => {
        const startY = 36;
        if (fs.existsSync(LOGO_PATH)) {
          try {
            doc.image(LOGO_PATH, LEFT, startY, {
              fit: [62, 62],
              align: "left",
              valign: "center",
            });
          } catch (error) {
            console.warn(
              "Logo could not be loaded:",
              error.message
            );
          }
        }
        const headerX = LEFT + 76;
        doc
          .font("Helvetica-Bold")
          .fontSize(22)
          .fillColor(colors.primary)
          .text(
            "OM TIFFIN SERVICE",
            headerX,
            startY + 4,
            {
              width: 260,
            }
          );
        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(colors.muted)
          .text(
            "Healthy - Fresh - Homemade",
            headerX,
            startY + 34
          );
        doc
          .font("Helvetica-Bold")
          .fontSize(18)
          .fillColor(colors.text)
          .text(
            "TAX INVOICE",
            RIGHT - 165,
            startY + 3,
            {
              width: 165,
              align: "right",
            }
          );
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#374151")
          .text(
            `Invoice: ${safe(bill.invoiceNo)}`,
            RIGHT - 190,
            startY + 32,
            {
              width: 190,
              align: "right",
            }
          );
        doc.text(
          `Date: ${new Date().toLocaleDateString("en-IN")}`,
          RIGHT - 190,
          startY + 47,
          {
            width: 190,
            align: "right",
          }
        );
        drawLine(startY + 78);
        doc.y = startY + 98;
      };
      // =========================================================
      // CUSTOMER DETAILS
      // =========================================================
      const drawCustomerDetails = () => {
        pageBreak(116);
        const y = doc.y;
        const gap = 18;
        const boxWidth = (CONTENT_WIDTH - gap) / 2;
        const boxHeight = 112;
        drawRoundedBox(
          LEFT,
          y,
          boxWidth,
          boxHeight,
          colors.white,
          "#dbe3ef"
        );
        drawRoundedBox(
          LEFT + boxWidth + gap,
          y,
          boxWidth,
          boxHeight,
          colors.white,
          "#dbe3ef"
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Customer Details",
            LEFT + 14,
            y + 14
          );
        doc
          .font("Helvetica")
          .fontSize(9.2)
          .fillColor("#374151");
        doc.text(
          `Name: ${safe(customer?.customerName)}`,
          LEFT + 14,
          y + 38,
          {
            width: boxWidth - 28,
          }
        );
        doc.text(
          `Mobile: ${safe(customer?.phone)}`,
          LEFT + 14,
          y + 55,
          {
            width: boxWidth - 28,
          }
        );
        doc.text(
          `Address: ${safe(customer?.address)}`,
          LEFT + 14,
          y + 72,
          {
            width: boxWidth - 28,
            height: 28,
            ellipsis: true,
          }
        );
        const billingX = LEFT + boxWidth + gap;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Billing Details",
            billingX + 14,
            y + 14
          );
        doc
          .font("Helvetica")
          .fontSize(9.2)
          .fillColor("#374151");
        doc.text(
          `Month: ${safe(bill.month)}`,
          billingX + 14,
          y + 38
        );
        doc.text(
          `Year: ${safe(bill.year)}`,
          billingX + 14,
          y + 55
        );
        const period =
          String(bill.cycle) === "1"
            ? "1 - 15"
            : String(bill.cycle) === "2"
              ? "16 - End"
              : safe(bill.billingPeriod);
        doc.text(
          `Period: ${period}`,
          billingX + 14,
          y + 72
        );
        doc.y = y + boxHeight + 20;
      };
      // =========================================================
      // DATE-WISE TABLE
      // =========================================================
      const columns = [
        {
          key: "date",
          title: "Date",
          width: 62,
          align: "left",
        },
        {
          key: "breakfast",
          title: "Breakfast",
          width: 78,
          align: "center",
        },
        {
          key: "lunch",
          title: "Lunch",
          width: 78,
          align: "center",
        },
        {
          key: "dinner",
          title: "Dinner",
          width: 78,
          align: "center",
        },
        {
          key: "extra",
          title: "Extra Item",
          width: 92,
          align: "left",
        },
        {
          key: "extraAmount",
          title: "Extra",
          width: 60,
          align: "right",
        },
        {
          key: "total",
          title: "Total",
          width: 75.28,
          align: "right",
        },
      ];
      // Sum = CONTENT_WIDTH exactly.
      const columnTotal = columns.reduce(
        (sum, column) => sum + column.width,
        0
      );
      if (columnTotal !== CONTENT_WIDTH) {
        console.warn(
          `PDF table width mismatch: ${columnTotal} vs ${CONTENT_WIDTH}`
        );
      }
      const drawTableHeader = () => {
        const y = doc.y;
        const headerHeight = 30;
        doc
          .rect(LEFT, y, CONTENT_WIDTH, headerHeight)
          .fill(colors.tableHeader);
        let x = LEFT;
        columns.forEach((column, index) => {
          doc
            .font("Helvetica-Bold")
            .fontSize(7.2)
            .fillColor(colors.white)
            .text(
              column.title,
              x + 3,
              y + 10,
              {
                width: column.width - 6,
                align: "center",
                lineBreak: false,
              }
            );
          if (index < columns.length - 1) {
            doc
              .moveTo(x + column.width, y)
              .lineTo(
                x + column.width,
                y + headerHeight
              )
              .strokeColor("#93c5fd")
              .lineWidth(0.6)
              .stroke();
          }
          x += column.width;
        });
        // Outer border.
        doc
          .rect(LEFT, y, CONTENT_WIDTH, headerHeight)
          .strokeColor("#1e40af")
          .lineWidth(0.8)
          .stroke();
        doc.y = y + headerHeight;
      };
      const drawDailyRow = (day, rowIndex) => {
        const extraItems = getExtraItems(day);
        const extraText = getExtraText(extraItems);
        const values = [
          getDateText(day?.date),
          getMealCell(
            day?.breakfastQty,
            day?.breakfastAmount
          ),
          getMealCell(
            day?.lunchQty,
            day?.lunchAmount
          ),
          getMealCell(
            day?.dinnerQty,
            day?.dinnerAmount
          ),
          extraText,
          formatMoney(day?.extraAmount),
          formatMoney(day?.dailyTotal),
        ];
        // Calculate row height based on the tallest text cell.
        const extraHeight = doc.heightOfString(
          extraText,
          {
            width: columns[4].width - 10,
            font: "Helvetica",
            fontSize: 7,
            lineGap: 1,
          }
        );
        const mealHeights = values
          .slice(0, 4)
          .map((value, index) =>
            doc.heightOfString(value, {
              width: columns[index].width - 10,
              font: "Helvetica",
              fontSize: 7,
              lineGap: 1,
            })
          );
        const totalTextHeight = doc.heightOfString(
          values[6],
          {
            width: columns[6].width - 10,
            font: "Helvetica-Bold",
            fontSize: 7,
          }
        );
        const maxTextHeight = Math.max(
          extraHeight,
          totalTextHeight,
          ...mealHeights,
          10
        );
        const rowHeight = Math.max(
          30,
          Math.min(62, Math.ceil(maxTextHeight) + 16)
        );
        // Important:
        // Never split a single date row.
        if (doc.y + rowHeight > BOTTOM_SAFE) {
          doc.addPage();
          doc.y = 42;
          drawTableHeader();
        }
        const y = doc.y;
        // Alternating row background.
        doc
          .rect(
            LEFT,
            y,
            CONTENT_WIDTH,
            rowHeight
          )
          .fill(
            rowIndex % 2 === 0
              ? colors.white
              : colors.tableAlt
          );
        let x = LEFT;
      values.forEach((value, index) => {
        const column = columns[index];
        // ====================================================
        // EXTRA ITEM COLUMN
        // Draw + symbol + graphical food icon + item name
        // + individual amount.
        // ====================================================
        if (index === 4 && extraItems.length > 0) {
          let itemY = y + 7;
          extraItems.forEach((item) => {
            const description = safe(item?.description, "Item").replace(/^Extra\s+/i, "").trim();
            const amount = Number(item?.amount || 0);
            const iconPath = getExtraIconPath(description);
            // + symbol
            doc
              .font("Helvetica-Bold")
              .fontSize(7)
              .fillColor(colors.text)
              .text(
                "+",
                x + 4,
                itemY + 1,
                {
                  width: 7,
                  height: 10,
                  lineBreak: false,
                }
              );
            // Graphical emoji icon
            if (fs.existsSync(iconPath)) {
              doc.image(
                iconPath,
                x + 12,
                itemY,
                {
                  width: 10,
                  height: 10,
                }
              );
            }
            // Extra item name
            doc
              .font("Helvetica")
              .fontSize(7)
              .fillColor(colors.text)
              .text(
                description,
                x + 24,
                itemY + 1,
                {
                  width: 42,
                  height: 10,
                  lineBreak: false,
                  ellipsis: true,
                }
              );
            // Individual amount
            doc
              .font("Helvetica")
              .fontSize(6.5)
              .fillColor(colors.text)
              .text(String(amount),
                x + 28 + Math.min(doc.widthOfString(description, { font: "Helvetica", fontSize: 7 }), 34), itemY + 1,
                {
                  width: 22,
                  height: 10,
                  align: "left",
                  lineBreak: false,
                  ellipsis: true,
                }
              );
            itemY += 11;
          });
        } else {
          doc
            .font(
              index === 6
                ? "Helvetica-Bold"
                : "Helvetica"
            )
            .fontSize(7)
            .fillColor(
              index === 6
                ? colors.green
                : colors.text
            )
            .text(
              value,
              x + 5,
              y + 8,
              {
                width: column.width - 10,
                height: rowHeight - 12,
                align: column.align,
                lineGap: 1,
                ellipsis: true,
              }
            );
        }
        if (index < columns.length - 1) {
          doc
            .moveTo(x + column.width, y)
            .lineTo(
              x + column.width,
              y + rowHeight
            )
            .strokeColor(colors.border)
            .lineWidth(0.7)
            .stroke();
        }
        x += column.width;
      });
      // Horizontal separator.
        doc
          .moveTo(LEFT, y + rowHeight)
          .lineTo(
            RIGHT,
            y + rowHeight
          )
          .strokeColor(colors.border)
          .lineWidth(0.7)
          .stroke();
        // Outer left/right borders.
        doc
          .moveTo(LEFT, y)
          .lineTo(LEFT, y + rowHeight)
          .strokeColor(colors.border)
          .lineWidth(0.7)
          .stroke();
        doc
          .moveTo(RIGHT, y)
          .lineTo(RIGHT, y + rowHeight)
          .strokeColor(colors.border)
          .lineWidth(0.7)
          .stroke();
        doc.y = y + rowHeight;
      };
      const drawDailyTable = () => {
        drawSectionTitle("Date-wise Meal Details");
        pageBreak(30);
        drawTableHeader();
        const dailyDetails = Array.isArray(
          bill.dailyDetails
        )
          ? bill.dailyDetails
          : [];
        dailyDetails.forEach((day, index) => {
          drawDailyRow(day, index);
        });
        // Grand total row.
        if (doc.y + 36 > BOTTOM_SAFE) {
          doc.addPage();
          doc.y = 42;
        }
        const y = doc.y;
        doc
          .rect(LEFT, y, CONTENT_WIDTH, 36)
          .fill("#f1f5f9")
          .stroke("#cbd5e1");
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(colors.text)
          .text(
            "Grand Total",
            LEFT + 8,
            y + 12,
            {
              width: CONTENT_WIDTH - 105,
              align: "right",
            }
          );
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(colors.green)
          .text(
            formatMoney(bill.totalAmount),
            RIGHT - 88,
            y + 12,
            {
              width: 78,
              align: "right",
            }
          );
        doc.y = y + 52;
      };
      // =========================================================
      // PAYMENT SUMMARY
      // =========================================================
      const drawPaymentSummary = () => {
        pageBreak(130);
        const y = doc.y;
        const gap = 18;
        const boxWidth = (CONTENT_WIDTH - gap) / 2;
        const boxHeight = 120;
        drawRoundedBox(
          LEFT,
          y,
          boxWidth,
          boxHeight,
          colors.greenBg,
          "#bbf7d0"
        );
        drawRoundedBox(
          LEFT + boxWidth + gap,
          y,
          boxWidth,
          boxHeight,
          colors.blueBg,
          "#bfdbfe"
        );
        // ---- Payment Summary ----
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Payment Summary",
            LEFT + 14,
            y + 14
          );
        const currentAmount =
          Number(bill.totalAmount || 0) -
          Number(bill.previousPendingAmount || 0);
        const previousPending =
          Number(bill.previousPendingAmount || 0);
        const totalPayable =
          Number(bill.totalAmount || 0);
        const paidAmount =
          Number(bill.paidAmount || 0);
        const pendingAmount =
          Number(bill.pendingAmount || 0);
        const paymentRows = [
          [
            "Current Cycle",
            formatMoney(currentAmount),
          ],
          [
            "Previous Pending",
            formatMoney(previousPending),
          ],
          [
            "Total Payable",
            formatMoney(totalPayable),
          ],
          [
            "Paid",
            formatMoney(paidAmount),
          ],
          [
            "Pending",
            formatMoney(pendingAmount),
          ],
        ];
        let paymentY = y + 40;
        paymentRows.forEach(
          ([label, value], index) => {
            doc
              .font(
                index === 2
                  ? "Helvetica-Bold"
                  : "Helvetica"
              )
              .fontSize(index === 2 ? 8.5 : 8)
              .fillColor(
                index === 4
                  ? colors.red
                  : index === 3
                    ? "#16a34a"
                    : colors.text
              )
              .text(
                label,
                LEFT + 14,
                paymentY
              );
            doc
              .font(
                index === 2
                  ? "Helvetica-Bold"
                  : "Helvetica"
              )
              .fontSize(index === 2 ? 8.5 : 8)
              .fillColor(
                index === 4
                  ? colors.red
                  : index === 3
                    ? "#16a34a"
                    : colors.text
              )
              .text(
                value,
                LEFT + boxWidth - 100,
                paymentY,
                {
                  width: 84,
                  align: "right",
                }
              );
            paymentY += 14;
          }
        );
        // ---- Status ----
        const statusX = LEFT + boxWidth + gap;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Bill Status",
            statusX + 14,
            y + 14
          );
        const status = safe(
          bill.status,
          "Generated"
        );
        doc
          .roundedRect(
            statusX + 25,
            y + 54,
            boxWidth - 50,
            32,
            16
          )
          .fill(colors.primary);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(colors.white)
          .text(
            status,
            statusX + 25,
            y + 65,
            {
              width: boxWidth - 50,
              align: "center",
            }
          );
        if (previousPending > 0) {
          doc
            .font("Helvetica")
            .fontSize(7.5)
            .fillColor(colors.muted)
            .text(
              "Previous cycle pending carried forward",
              statusX + 12,
              y + 96,
              {
                width: boxWidth - 24,
                align: "center",
              }
            );
        }
        doc.y = y + boxHeight + 20;
      };
      // =========================================================
      // QR + PAYMENT DETAILS
      // =========================================================
      const drawPaymentDetails = async () => {
        // Keep the complete QR + payment-details section together.
        // If the complete block cannot fit, move everything to
        // the next page before drawing anything.
        pageBreak(200);
        const y = doc.y;
        const gap = 18;
        const boxWidth = (CONTENT_WIDTH - gap) / 2;
        const boxHeight = 178;
        drawRoundedBox(
          LEFT,
          y,
          boxWidth,
          boxHeight,
          colors.white,
          colors.border
        );
        drawRoundedBox(
          LEFT + boxWidth + gap,
          y,
          boxWidth,
          boxHeight,
          colors.white,
          colors.border
        );
        const pendingAmount =
          Number(bill.pendingAmount || 0);
        const upiId = "malaybarochiya-5@oksbi";
        const upiUrl =
          `upi://pay?pa=${encodeURIComponent(upiId)}` +
          `&pn=${encodeURIComponent(
            "OM Tiffin Service"
          )}` +
          `&am=${pendingAmount.toFixed(2)}`;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Scan & Pay",
            LEFT,
            y + 13,
            {
              width: boxWidth,
              align: "center",
            }
          );
        // QR is deliberately smaller than the box so caption
        // and amount never overlap it.
        try {
          const qrDataUrl =
            await QRCode.toDataURL(
              upiUrl,
              {
                width: 140,
                margin: 1,
                errorCorrectionLevel: "M",
              }
            );
          const base64Data =
            qrDataUrl.replace(
              /^data:image\/png;base64,/,
              ""
            );
          const qrBuffer = Buffer.from(
            base64Data,
            "base64"
          );
          doc.image(
            qrBuffer,
            LEFT + (boxWidth - 112) / 2,
            y + 35,
            {
              fit: [112, 112],
            }
          );
        } catch (error) {
          console.warn(
            "QR generation failed:",
            error.message
          );
        }
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(colors.red)
          .text(
            `Pending: ${formatMoney(pendingAmount)}`,
            LEFT,
            y + 145,
            {
              width: boxWidth,
              align: "center",
            }
          );
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(colors.muted)
          .text(
            "Scan this QR using any UPI App",
            LEFT,
            y + 158,
            {
              width: boxWidth,
              align: "center",
            }
          );
        // ---- Payment details ----
        const paymentX = LEFT + boxWidth + gap;
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.text)
          .text(
            "Payment Details",
            paymentX + 14,
            y + 13
          );
        const paymentRows = [
          ["UPI ID", upiId],
          ["A/c No.", "45073878066"],
          [
            "Account Name",
            "OM TIFFIN SERVICE",
          ],
          ["IFSC", "SBIN0032214"],
          ["Bank", "State Bank of India"],
        ];
        let paymentY = y + 43;
        paymentRows.forEach(
          ([label, value]) => {
            doc
              .font("Helvetica")
              .fontSize(7.5)
              .fillColor(colors.muted)
              .text(
                label,
                paymentX + 14,
                paymentY,
                {
                  width: 68,
                }
              );
            doc
              .font("Helvetica-Bold")
              .fontSize(7.5)
              .fillColor(colors.text)
              .text(
                value,
                paymentX + 84,
                paymentY,
                {
                  width: boxWidth - 98,
                  align: "right",
                  ellipsis: true,
                }
              );
            paymentY += 24;
          }
        );
        doc.y = y + boxHeight + 20;
      };
      // =========================================================
      // TERMS
      // =========================================================
      const drawTerms = () => {
        pageBreak(96);
        const terms = [
          "Payment due within 7 days.",
          "Meals once delivered cannot be refunded.",
          "Contact OM Tiffin Service for any billing issue.",
        ];
        const y = doc.y;
        const boxHeight = 92;
        drawRoundedBox(
          LEFT,
          y,
          CONTENT_WIDTH,
          boxHeight,
          colors.yellowBg,
          colors.yellowBorder
        );
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(colors.text)
          .text(
            "Terms & Conditions",
            LEFT + 15,
            y + 13
          );
        let termY = y + 36;
        terms.forEach((term) => {
          doc
            .font("Helvetica")
            .fontSize(7.8)
            .fillColor("#374151")
            .text(
              `• ${term}`,
              LEFT + 17,
              termY,
              {
                width: CONTENT_WIDTH - 34,
              }
            );
          termY += 15;
        });
        doc.y = y + boxHeight + 18;
      };
      // =========================================================
      // FOOTER
      // =========================================================
      const drawContentFooter = () => {
        pageBreak(100);
        const y = doc.y;
        drawLine(y);
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor(colors.primary)
          .text(
            "Thank You",
            LEFT,
            y + 15
          );
        const halfWidth =
          (CONTENT_WIDTH - 18) / 2;
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#4b5563")
          .text(
            "Thank you for choosing OM TIFFIN SERVICE. " +
              "We appreciate your trust and look forward " +
              "to serving you with fresh, healthy and " +
              "hygienic homemade meals every day.",
            LEFT,
            y + 37,
            {
              width: halfWidth,
              lineGap: 2,
            }
          );
        const contactX =
          LEFT + halfWidth + 18;
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(colors.text)
          .text(
            "Contact Information",
            contactX,
            y + 15
          );
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#374151")
          .text(
            "+91 70162 97983",
            contactX,
            y + 38,
            {
              width: halfWidth,
              align: "right",
            }
          );
        doc.text(
          "Gandhinagar, Gujarat",
          contactX,
          y + 55,
          {
            width: halfWidth,
            align: "right",
          }
        );
        doc.y = y + 82;
        drawLine(doc.y);
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(colors.muted)
          .text(
            "© 2026 OM TIFFIN SERVICE",
            LEFT,
            doc.y + 9,
            {
              width: CONTENT_WIDTH,
              align: "center",
            }
          );
        doc.text(
          "Powered By OM Tiffin Management System",
          LEFT,
          doc.y + 22,
          {
            width: CONTENT_WIDTH,
            align: "center",
          }
        );
      };
      // =========================================================
      // BUILD PDF
      // =========================================================
      drawHeader();
      drawCustomerDetails();
      drawDailyTable();
      drawPaymentSummary();
      await drawPaymentDetails();
      drawTerms();
      drawContentFooter();
      // =========================================================
      // PAGE NUMBERS
      // =========================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (
        let pageIndex = range.start;
        pageIndex <
        range.start + totalPages;
        pageIndex++
      ) {
        doc.switchToPage(pageIndex);
        // Draw page number inside the existing page boundary.
        // Never allow PDFKit to auto-create another page.
        doc.save();
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor("#9ca3af")
          .text(
            `Page ${
              pageIndex - range.start + 1
            } of ${totalPages}`,
            LEFT,
            PAGE_HEIGHT - 36,
            {
              width: CONTENT_WIDTH,
              align: "center",
              lineBreak: false,
              height: 9,
            }
          );
        doc.restore();
      }
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
module.exports = generateBillPdf;
