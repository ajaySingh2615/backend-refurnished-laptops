/**
 * Printable HTML invoice (GST-compliant layout). Opens in a new tab and users
 * press Ctrl/Cmd+P → "Save as PDF".
 */

function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function renderInvoiceHtml({ invoice, order, items, address, buyer, shop }) {
  const isIntra = Number(invoice.igst) === 0;
  const itemRows = items
    .map((it, idx) => {
      const qty = Number(it.quantity);
      const unit = Number(it.unitPrice);
      const gross = Number(it.lineTotal);
      const rate = Number(it.gstPercent);
      const taxable = rate > 0 ? gross / (1 + rate / 100) : gross;
      const tax = gross - taxable;
      const cgst = isIntra ? tax / 2 : 0;
      const sgst = isIntra ? tax / 2 : 0;
      const igst = isIntra ? 0 : tax;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div class="name">${esc(it.productName)}</div>
            <div class="muted">${esc(it.variantName)}</div>
          </td>
          <td class="num">${qty}</td>
          <td class="num">${inr(unit)}</td>
          <td class="num">${inr(taxable)}</td>
          <td class="num">${rate.toFixed(0)}%</td>
          ${
            isIntra
              ? `<td class="num">${inr(cgst)}</td><td class="num">${inr(sgst)}</td>`
              : `<td class="num">${inr(igst)}</td>`
          }
          <td class="num strong">${inr(gross)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice ${esc(invoice.invoiceNumber)}</title>
<style>
  :root {
    --fg: #0f172a;
    --muted: #64748b;
    --border: #e2e8f0;
    --bg-soft: #f8fafc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    color: var(--fg);
    font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #fff;
  }
  .sheet { max-width: 820px; margin: 0 auto; }
  .actions { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .actions button {
    background: #0f172a; color: #fff; border: 0; border-radius: 6px;
    padding: 8px 14px; cursor: pointer; font-size: 13px;
  }
  .actions button:hover { background: #1e293b; }
  .head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid var(--fg); padding-bottom: 16px; }
  .brand h1 { margin: 0; font-size: 22px; letter-spacing: -0.01em; }
  .brand p { margin: 2px 0 0; color: var(--muted); font-size: 12px; }
  .meta { text-align: right; font-size: 12px; }
  .meta strong { font-size: 14px; }
  .meta .muted { color: var(--muted); }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin: 24px 0 8px; font-weight: 600; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
  .parties .name { font-weight: 600; }
  .parties .line { margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
  th { background: var(--bg-soft); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; color: var(--muted); font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .strong { font-weight: 600; }
  .muted { color: var(--muted); font-size: 11px; }
  .totals { margin-top: 16px; margin-left: auto; width: 300px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid var(--fg); margin-top: 6px; padding-top: 10px; font-size: 15px; font-weight: 600; }
  .foot { margin-top: 40px; text-align: center; color: var(--muted); font-size: 11px; border-top: 1px solid var(--border); padding-top: 14px; }
  @media print {
    body { padding: 0; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="actions"><button onclick="window.print()">Print / Save PDF</button></div>

    <div class="head">
      <div class="brand">
        <h1>${esc(shop?.shopName || "Tax Invoice")}</h1>
        <p>${esc(shop?.address || "")}</p>
        <p>GSTIN: <strong>${esc(shop?.gstin || "—")}</strong> · PAN: ${esc(shop?.pan || "—")}</p>
        <p>${esc(shop?.email || "")} · ${esc(shop?.phone || "")}</p>
      </div>
      <div class="meta">
        <strong>TAX INVOICE</strong>
        <div class="muted">Invoice #</div>
        <div><strong>${esc(invoice.invoiceNumber)}</strong></div>
        <div class="muted" style="margin-top: 6px;">Order #</div>
        <div>${esc(order.orderNumber)}</div>
        <div class="muted" style="margin-top: 6px;">Issued</div>
        <div>${esc(formatDate(invoice.issuedAt))}</div>
      </div>
    </div>

    <div class="parties">
      <div>
        <h2>Bill to</h2>
        <div class="name">${esc(invoice.buyerName)}</div>
        <div class="line">${esc(invoice.buyerAddress)}</div>
        <div class="line muted">${esc(buyer?.email || "")} ${esc(buyer?.phone ? "· " + buyer.phone : "")}</div>
      </div>
      <div>
        <h2>Ship to</h2>
        <div class="name">${esc(address?.fullName || invoice.buyerName)}</div>
        <div class="line">${esc(
          [
            address?.addressLine1,
            address?.addressLine2,
            address?.city,
            address?.state,
            address?.pincode,
          ]
            .filter(Boolean)
            .join(", ")
        )}</div>
        <div class="line muted">Place of supply: ${esc(invoice.buyerState)}</div>
      </div>
    </div>

    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Unit (incl.)</th>
          <th class="num">Taxable</th>
          <th class="num">GST</th>
          ${isIntra ? "<th class=\"num\">CGST</th><th class=\"num\">SGST</th>" : "<th class=\"num\">IGST</th>"}
          <th class="num">Line total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      <div><span>Taxable value</span><span>${inr(invoice.subtotal)}</span></div>
      ${
        isIntra
          ? `<div><span>CGST</span><span>${inr(invoice.cgst)}</span></div>
             <div><span>SGST</span><span>${inr(invoice.sgst)}</span></div>`
          : `<div><span>IGST</span><span>${inr(invoice.igst)}</span></div>`
      }
      <div><span>Shipping</span><span>${inr(order.shippingCost)}</span></div>
      <div class="grand"><span>Grand total</span><span>${inr(order.grandTotal)}</span></div>
    </div>

    <div class="foot">
      This is a computer-generated invoice. Goods once sold will only be returned as per policy.
    </div>
  </div>
</body>
</html>`;
}
