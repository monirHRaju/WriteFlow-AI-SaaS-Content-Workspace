import slugify from 'slugify';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { TemplatesRepository } from './templates.repository';
import { Prisma, Template } from '@prisma/client';
import { getCache, setCache, invalidateCachePattern } from '../../utils/redis';

export class TemplatesService {
  /**
   * Create a new template with slugification and validation.
   * @param data Creation payload
   * @param creatorId User ID of the creator
   */
  static async createTemplate(data: Prisma.TemplateUncheckedCreateInput, creatorId: string): Promise<Template> {
    // Force creator association
    data.createdById = creatorId;

    // Generate unique slug
    let slug = slugify(data.title, { lower: true, strict: true });
    
    // Check if slug collision exists
    const existingTemplate = await TemplatesRepository.findBySlug(slug);
    if (existingTemplate) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }
    data.slug = slug;

    // Create the template in the database
    const newTemplate = await TemplatesRepository.create(data);

    // Invalidate the popular templates cache
    await invalidateCachePattern('templates:popular:*');

    return newTemplate;
  }

  /**
   * Update template details and re-slugify if title is updated.
   * @param id Template ID
   * @param payload Update payload
   */
  static async updateTemplate(id: string, payload: Prisma.TemplateUpdateInput): Promise<Template> {
    const template = await TemplatesRepository.findById(id);
    if (!template) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Template not found or has been deleted.');
    }

    // If title is changing, regenerate the slug
    if (payload.title && typeof payload.title === 'string') {
      let slug = slugify(payload.title, { lower: true, strict: true });
      const existingSlug = await TemplatesRepository.findBySlug(slug);
      
      // If the slug exists and belongs to a different template, append a suffix
      if (existingSlug && existingSlug.id !== id) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${suffix}`;
      }
      payload.slug = slug;
    }

    const updatedTemplate = await TemplatesRepository.update(id, payload);

    // Invalidate the popular templates cache
    await invalidateCachePattern('templates:popular:*');

    return updatedTemplate;
  }

  /**
   * Soft-delete a template by setting isPublished to false.
   * @param id Template ID
   */
  static async softDeleteTemplate(id: string): Promise<Template> {
    const template = await TemplatesRepository.findById(id);
    if (!template) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Template not found or has been deleted.');
    }

    const softDeleted = await TemplatesRepository.softDelete(id);

    // Invalidate the popular templates cache
    await invalidateCachePattern('templates:popular:*');

    return softDeleted;
  }

  /**
   * Increment template usage counter.
   * @param id Template ID
   */
  static async useTemplate(id: string): Promise<Template> {
    const template = await TemplatesRepository.findById(id);
    if (!template) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Template not found or has been deleted.');
    }

    return TemplatesRepository.incrementUsageCount(id);
  }

  /**
   * Retrieve a single template by slug.
   * @param slug Template slug
   */
  static async getTemplateBySlug(slug: string): Promise<Template> {
    const template = await TemplatesRepository.findBySlug(slug);
    if (!template) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Template not found.');
    }
    return template;
  }

  /**
   * Retrieve all matching templates with pagination, caching the 'popular' sort query in Redis.
   * @param params Query and pagination parameters
   */
  static async getAllTemplates(params: {
    search?: string;
    category?: string;
    sort?: 'popular' | 'newest' | 'rating';
    page?: number;
    limit?: number;
    isAdmin?: boolean;
  }): Promise<{ items: Template[]; total: number }> {
    const { search, category, sort, page = 1, limit = 10, isAdmin = false } = params;

    // Cache popular templates only
    if (sort === 'popular') {
      const cacheKey = `templates:popular:search=${search || ''}:category=${category || ''}:page=${page}:limit=${limit}:isAdmin=${isAdmin}`;
      
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const result = await TemplatesRepository.findAll(params);
      
      // Store in cache for 60 seconds
      await setCache(cacheKey, JSON.stringify(result), 60);

      return result;
    }

    // Direct database query for non-popular queries
    return TemplatesRepository.findAll(params);
  }
}
