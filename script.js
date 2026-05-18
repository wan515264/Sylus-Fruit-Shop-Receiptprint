const orderFields = {
  customer: document.querySelector("#customer"),
  date: document.querySelector("#date"),
  number: document.querySelector("#order-number"),
  sum: document.querySelector("#sum")
};

const receiptFields = {
  lines: document.querySelector("#receipt-lines"),
  number: document.querySelector("#receipt-number"),
  date: document.querySelector("#receipt-date"),
  total: document.querySelector("#receipt-total"),
  customerTop: document.querySelector("#receipt-customer-top")
};

const orderItemsList = document.querySelector("#order-items-list");
const addItemButton = document.querySelector("#add-item");
const printButton = document.querySelector("#print-receipt");
const generatedReceipt = document.querySelector(".generated-receipt");
const receiptImage = document.querySelector("#receipt-image");
const downloadReceipt = document.querySelector("#download-receipt");
const logoImage = document.querySelector(".brand-logo");

function parseMoney(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function formatMoney(value) {
  return `¥ ${value.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function createItemRow(item = "", amount = "", price = "") {
  const row = document.createElement("div");
  row.className = "order-item-row";
  row.innerHTML = `
    <input class="item-name" aria-label="Item name" value="">
    <input class="item-amount" aria-label="Item amount" type="number" min="1" value="">
    <input class="item-price" aria-label="Item price" value="">
    <button class="remove-item" type="button" aria-label="Remove item">×</button>
  `;

  row.querySelector(".item-name").value = item;
  row.querySelector(".item-amount").value = amount;
  row.querySelector(".item-price").value = price;
  return row;
}

function getItems() {
  return Array.from(orderItemsList.querySelectorAll(".order-item-row"))
    .map((row) => {
      const rawItem = row.querySelector(".item-name").value.trim();
      const amount = Number(row.querySelector(".item-amount").value) || 0;
      const price = parseMoney(row.querySelector(".item-price").value);
      return {
        item: rawItem || "Item",
        hasData: Boolean(rawItem || amount || price),
        amount,
        price,
        lineTotal: amount * price
      };
    })
    .filter((entry) => entry.hasData);
}

function getOrderData() {
  const items = getItems();
  const sum = items.reduce((total, entry) => total + entry.lineTotal, 0);

  return {
    customer: orderFields.customer.value.trim() || "Guest",
    date: orderFields.date.value,
    number: orderFields.number.value.trim() || "0000000000",
    items,
    sum
  };
}

function renderReceiptLines(items) {
  receiptFields.lines.innerHTML = "";

  items.forEach((entry) => {
    const line = document.createElement("div");
    line.className = "line-item";
    line.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    line.children[0].textContent = entry.item;
    line.children[1].textContent = `x ${entry.amount}`;
    line.children[2].textContent = formatMoney(entry.lineTotal);
    receiptFields.lines.append(line);
  });
}

function syncReceipt() {
  const data = getOrderData();
  orderFields.sum.value = formatMoney(data.sum);
  receiptFields.number.textContent = `Receipt No. ${data.number}`;
  receiptFields.date.textContent = formatDate(data.date);
  receiptFields.total.textContent = formatMoney(data.sum);
  receiptFields.customerTop.textContent = data.customer;
  renderReceiptLines(data.items);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split("");
  let line = "";
  let lineCount = 0;

  for (const word of words) {
    const testLine = line + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y + lineCount * lineHeight);
  return y + (lineCount + 1) * lineHeight;
}

function drawReceiptImage() {
  syncReceipt();

  const data = getOrderData();
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 520;
  const itemHeight = 38;
  const height = Math.max(800, 760 + data.items.length * itemHeight);
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#7b0715";
  ctx.lineWidth = 2;
  for (let x = 24; x < width - 24; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 24);
    ctx.stroke();
  }

  ctx.drawImage(logoImage, 70, 44, 380, 380);

  ctx.strokeStyle = "rgba(123, 7, 21, 0.55)";
  ctx.beginPath();
  ctx.moveTo(38, 442);
  ctx.lineTo(width - 38, 442);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#4c1219";
  ctx.font = "700 14px Courier New, monospace";
  ctx.fillText("Customer", 38, 476);
  ctx.textAlign = "right";
  ctx.fillStyle = "#7b0715";
  ctx.font = "900 20px Times New Roman, SimSun, serif";
  ctx.fillText(data.customer, width - 38, 476);

  ctx.textAlign = "left";
  ctx.fillStyle = "#4c1219";
  ctx.font = "700 14px Courier New, monospace";
  ctx.fillText(`Receipt No. ${data.number}`, 38, 508);
  ctx.textAlign = "right";
  ctx.fillText(formatDate(data.date), width - 38, 508);

  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(38, 532);
  ctx.lineTo(width - 38, 532);
  ctx.stroke();
  ctx.setLineDash([]);

  let y = 574;
  data.items.forEach((entry) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#2b070c";
    ctx.font = "700 18px Times New Roman, SimSun, serif";
    const nextY = drawWrappedText(ctx, entry.item, 38, y, 260, 22);

    ctx.textAlign = "center";
    ctx.font = "700 15px Courier New, monospace";
    ctx.fillText(`x ${entry.amount}`, width / 2 + 92, y);

    ctx.textAlign = "right";
    ctx.fillText(formatMoney(entry.lineTotal), width - 38, y);

    y = Math.max(nextY, y + itemHeight);
  });

  y += 12;
  ctx.strokeStyle = "#7b0715";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(38, y);
  ctx.lineTo(width - 38, y);
  ctx.stroke();

  y += 40;
  ctx.fillStyle = "#7b0715";
  ctx.textAlign = "left";
  ctx.font = "800 18px Courier New, monospace";
  ctx.fillText("TOTAL", 38, y);
  ctx.textAlign = "right";
  ctx.font = "900 34px Times New Roman, SimSun, serif";
  ctx.fillText(formatMoney(data.sum), width - 38, y + 4);

  ctx.textAlign = "center";
  ctx.fillStyle = "#6d252d";
  ctx.font = "700 11px Courier New, monospace";
  ctx.fillText("If you have any question,please feel free to contact:", width / 2, height - 76);
  ctx.fillText("Sylus,Onychinus,N109 Zone", width / 2, height - 58);
  ctx.fillText("Do not use for commercial purposes.", width / 2, height - 40);

  ctx.strokeStyle = "#7b0715";
  ctx.lineWidth = 2;
  for (let x = 24; x < width - 24; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  receiptImage.src = dataUrl;
  downloadReceipt.href = dataUrl;
  generatedReceipt.classList.add("is-visible");
}

function addItemRow(item, amount, price) {
  orderItemsList.append(createItemRow(item, amount, price));
  syncReceipt();
}

function addBlankItem() {
  addItemRow("", "", "");
}

function removeItemRow(button) {
  if (orderItemsList.querySelectorAll(".order-item-row").length === 1) return;
  button.closest(".order-item-row").remove();
  syncReceipt();
}

orderItemsList.addEventListener("input", syncReceipt);
orderItemsList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove-item")) return;
  removeItemRow(event.target);
});

Object.values(orderFields).forEach((field) => {
  field.addEventListener("input", syncReceipt);
});

addItemButton.onclick = addBlankItem;
printButton.addEventListener("click", drawReceiptImage);
syncReceipt();

if (logoImage.complete) {
  drawReceiptImage();
} else {
  logoImage.addEventListener("load", drawReceiptImage, { once: true });
}
