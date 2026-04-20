import { and, count, desc, eq, gte, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  users,
  orders,
  payments,
  products,
  productVariants,
} from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

// ── Users ──────────────────────────────────────────────

export async function listUsers({ page = 1, limit = 20, search, role } = {}) {
  const conditions = [];
  if (role && role !== "all") conditions.push(eq(users.role, role));
  if (search) {
    const s = `%${search}%`;
    conditions.push(or(ilike(users.name, s), ilike(users.email, s), ilike(users.phone, s)));
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const totalQuery = db.select({ total: count() }).from(users);
  if (where) totalQuery.where(where);
  const [{ total }] = await totalQuery;

  const baseQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isBanned: users.isBanned,
      authProvider: users.authProvider,
      createdAt: users.createdAt,
    })
    .from(users);

  if (where) baseQuery.where(where);

  const rows = await baseQuery
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  // Attach order stats
  const userIds = rows.map((r) => r.id);
  let stats = new Map();
  if (userIds.length) {
    const orderStats = await db
      .select({
        userId: orders.userId,
        orderCount: count(orders.id),
        totalSpent: sql`COALESCE(SUM(CASE WHEN ${orders.status} NOT IN ('cancelled', 'refunded') THEN ${orders.grandTotal}::numeric ELSE 0 END), 0)`,
      })
      .from(orders)
      .where(sql`${orders.userId} IN ${userIds}`)
      .groupBy(orders.userId);
    for (const s of orderStats) stats.set(s.userId, s);
  }

  return {
    items: rows.map((u) => ({
      ...u,
      orderCount: Number(stats.get(u.id)?.orderCount || 0),
      totalSpent: Number(stats.get(u.id)?.totalSpent || 0),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function setBanStatus(userId, adminId, { isBanned }) {
  if (userId === adminId) {
    throw ApiError.badRequest("You cannot ban your own account");
  }

  const [target] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) throw ApiError.notFound("User not found");
  if (target.role === "admin" && isBanned) {
    throw ApiError.badRequest("Admin accounts cannot be banned");
  }

  const [row] = await db
    .update(users)
    .set({ isBanned, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isBanned: users.isBanned,
    });
  return row;
}

// ── Dashboard stats ────────────────────────────────────

export async function dashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totals] = await db
    .select({
      totalOrders: count(),
      revenue: sql`COALESCE(SUM(CASE WHEN ${orders.status} NOT IN ('cancelled','refunded') THEN ${orders.grandTotal}::numeric ELSE 0 END), 0)`,
    })
    .from(orders);

  const [last30] = await db
    .select({
      orders: count(),
      revenue: sql`COALESCE(SUM(CASE WHEN ${orders.status} NOT IN ('cancelled','refunded') THEN ${orders.grandTotal}::numeric ELSE 0 END), 0)`,
    })
    .from(orders)
    .where(gte(orders.placedAt, thirtyDaysAgo));

  const [last7] = await db
    .select({
      orders: count(),
      revenue: sql`COALESCE(SUM(CASE WHEN ${orders.status} NOT IN ('cancelled','refunded') THEN ${orders.grandTotal}::numeric ELSE 0 END), 0)`,
    })
    .from(orders)
    .where(gte(orders.placedAt, sevenDaysAgo));

  const byStatus = await db
    .select({ status: orders.status, c: count() })
    .from(orders)
    .groupBy(orders.status);

  const [pendingPayments] = await db
    .select({ c: count() })
    .from(payments)
    .where(eq(payments.status, "pending"));

  const [productsCount] = await db
    .select({ c: count() })
    .from(products);

  const [variantsCount] = await db
    .select({ c: count() })
    .from(productVariants);

  const [customerCount] = await db
    .select({ c: count() })
    .from(users)
    .where(eq(users.role, "customer"));

  const recent = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      grandTotal: orders.grandTotal,
      status: orders.status,
      placedAt: orders.placedAt,
      userName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.placedAt))
    .limit(5);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = Number(row.c);
    return acc;
  }, {});

  return {
    totals: {
      orders: Number(totals?.totalOrders || 0),
      revenue: Number(totals?.revenue || 0),
    },
    last30: {
      orders: Number(last30?.orders || 0),
      revenue: Number(last30?.revenue || 0),
    },
    last7: {
      orders: Number(last7?.orders || 0),
      revenue: Number(last7?.revenue || 0),
    },
    byStatus: statusMap,
    pendingPayments: Number(pendingPayments?.c || 0),
    products: Number(productsCount?.c || 0),
    variants: Number(variantsCount?.c || 0),
    customers: Number(customerCount?.c || 0),
    recentOrders: recent,
  };
}
