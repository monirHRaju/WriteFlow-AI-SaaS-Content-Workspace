import { prisma } from '../../config/prisma';
import { Prisma, Template } from '@prisma/client';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

export class TemplatesRepository {
  /**
   * Persist a new Template inside a Prisma transaction.
   * Checks slug uniqueness atomically to avoid race conditions.
   * @param data Template creation data
   */
  static async create(data: Prisma.TemplateUncheckedCreateInput): Promise<Template> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.template.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new AppError(StatusCodes.CONFLICT, 'A template with this slug already exists.');
      }
      return tx.template.create({ data });
    });
  }

  /**
   * Update an existing Template.
   * @param id Template ID
   * @param data Update details
   */
  static async update(id: string, data: Prisma.TemplateUpdateInput): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-delete a template by setting isPublished to false.
   * @param id Template ID
   */
  static async softDelete(id: string): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  /**
   * Increment usage count atomically.
   * @param id Template ID
   */
  static async incrementUsageCount(id: string): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Retrieve a Template by primary key ID.
   * @param id Template ID
   */
  static async findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieve a single Template by its unique slug, including related reviews and creator profile.
   * @param slug Template slug
   */
  static async findBySlug(slug: string): Promise<any | null> {
    return prisma.template.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Query matching templates with support for search, category filter, sorting, and pagination.
   * @param params Query search & pagination parameters
   */
  static async findAll(params: {
    search?: string;
    category?: string;
    sort?: 'popular' | 'newest' | 'rating';
    page?: number;
    limit?: number;
    isAdmin?: boolean;
  }): Promise<{ items: Template[]; total: number }> {
    const { search, category, sort, page = 1, limit = 10, isAdmin = false } = params;

    const where: Prisma.TemplateWhereInput = {};

    // Public users only retrieve published templates
    if (!isAdmin) {
      where.isPublished = true;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.TemplateOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'popular') {
      orderBy = { usageCount: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.template.count({ where }),
    ]);

    return { items, total };
  }
}
