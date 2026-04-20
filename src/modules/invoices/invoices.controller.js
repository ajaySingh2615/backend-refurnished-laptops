import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./invoices.service.js";
import { renderInvoiceHtml } from "./invoice-template.js";

export async function getMyInvoice(req, res) {
  const data = await service.getInvoiceForOrder(req.params.orderId, {
    ownerUserId: req.user.id,
  });
  return ApiResponse.ok(res, "Invoice", data);
}

export async function getMyInvoiceHtml(req, res) {
  const data = await service.getInvoiceForOrder(req.params.orderId, {
    ownerUserId: req.user.id,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderInvoiceHtml(data));
}

export async function adminGetInvoice(req, res) {
  const data = await service.getInvoiceForOrder(req.params.orderId);
  return ApiResponse.ok(res, "Invoice", data);
}

export async function adminGetInvoiceHtml(req, res) {
  const data = await service.getInvoiceForOrder(req.params.orderId);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderInvoiceHtml(data));
}

export async function adminList(req, res) {
  const rows = await service.adminList({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });
  return ApiResponse.ok(res, "Invoices", rows);
}
