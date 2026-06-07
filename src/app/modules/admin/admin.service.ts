import { Prisma, Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../config/prisma";
import AppError from "../../errors/AppError";

export class AdminService {
  // ─── Analytics ──────────────────────────────────────────────────────────────

  static getAnalytics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalDocuments,
      tokensAgg,
      totalTemplates,
      rawSignups,
      aiUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.document.aggregate({ _sum: { tokensUsed: true } }),
      prisma.template.count(),
      // Raw daily signups — we aggregate in TS to format the date properly
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.aiLog.groupBy({
        by: ["agentType"],
        _sum: { tokensUsed: true },
        _count: { id: true },
      }),
    ]);

    // Bucket signups by calendar day
    const buckets: Record<string, number> = {};
    for (const { createdAt } of rawSignups) {
      const day = createdAt.toISOString().slice(0, 10);
      buckets[day] = (buckets[day] || 0) + 1;
    }
    const dailySignups = Object.entries(buckets).map(([date, count]) => ({
      date,
      count,
    }));

    const aiUsageByAgent = aiUsage.map((u) => ({
      agentType: u.agentType,
      totalTokens: u._sum.tokensUsed ?? 0,
      totalRequests: u._count.id,
    }));

    return {
      totalUsers,
      totalDocuments,
      totalTokensUsed: tokensAgg._sum.tokensUsed ?? 0,
      totalTemplates,
      dailySignups,
      aiUsageByAgent,
    };
  };

  // ─── Users ───────────────────────────────────────────────────────────────────

  static getUsers = async (params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }) => {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && ["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
      where.role = role as Role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { documents: true, aiLogs: true, templates: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  };

  static updateUserRole = async (
    id: string,
    role: Role,
    requesterId: string,
  ) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found.");

    if (requesterId === id && user.role === "ADMIN") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You cannot change your own admin role.",
      );
    }

    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  };

  static updateUserStatus = async (
    id: string,
    isActive: boolean,
    requesterId: string,
  ) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found.");

    if (requesterId === id && !isActive && user.role === "ADMIN") {
      throw new AppError(StatusCodes.BAD_REQUEST, "You cannot ban yourself.");
    }

    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  };

  // ─── Reviews ─────────────────────────────────────────────────────────────────

  static getPendingReviews = async (params: {
    page: number;
    limit: number;
  }) => {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          template: { select: { id: true, title: true, category: true } },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { status: "PENDING" } }),
    ]);

    return { reviews, total };
  };

  static updateReviewStatus = async (
    id: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new AppError(StatusCodes.NOT_FOUND, "Review not found.");

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        template: { select: { id: true, title: true, category: true } },
      },
    });

    // Recalculate template average rating from approved reviews only
    if (status === "APPROVED") {
      const approvedReviews = await prisma.review.findMany({
        where: { templateId: review.templateId, status: "APPROVED" },
        select: { rating: true },
      });
      const avg =
        approvedReviews.reduce((s, r) => s + r.rating, 0) /
        approvedReviews.length;
      await prisma.template.update({
        where: { id: review.templateId },
        data: { rating: parseFloat(avg.toFixed(2)) },
      });
    }

    return updated;
  };
}
