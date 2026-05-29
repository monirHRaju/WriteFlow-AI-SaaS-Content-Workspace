import { PrismaClient, Role, Plan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records to prevent unique collisions
  console.log('Cleaning existing records...');
  await prisma.review.deleteMany();
  await prisma.document.deleteMany();
  await prisma.aiLog.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  console.log('Creating Admin user...');
  const admin = await prisma.user.create({
    data: {
      name: 'WriteFlow Admin',
      email: 'admin@writeflow.ai',
      // Safe mocked bcrypt hash of "AdminPass123!"
      password: '$2b$10$e9eR4bW.S6iM7fS2wZp3O.H0gK8jQ4q.rU2aE5c5m2gC1eQ7kR2l.',
      role: Role.ADMIN,
      plan: Plan.TEAM,
      isActive: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    },
  });
  console.log(`Created admin user with ID: ${admin.id}`);

  // 3. Create Sample Templates
  console.log('Creating sample templates...');
  const templates = [
    {
      title: 'Blog Post Outliner',
      slug: 'blog-post-outliner',
      category: 'Writing',
      description: 'Generate a comprehensive outline for your blog posts to streamline your content creation process.',
      prompt: 'Create a detailed structure, headings (H2, H3), and key bullet points for a blog post titled: {title}. Target audience is {audience}.',
      sampleOutput: '## 1. Introduction\n- Hook: Why this topic matters.\n- Thesis: Core takeaway.\n## 2. Deep Dive\n- Key points...\n## 3. Summary & CTA',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=150',
      rating: 4.8,
      usageCount: 124,
      isPublished: true,
      createdById: admin.id,
    },
    {
      title: 'AI Email Responder',
      slug: 'ai-email-responder',
      category: 'Marketing',
      description: 'Draft quick, polite, and contextual replies to customer inquiries.',
      prompt: 'Write a professional email reply to this email: {email_content}. The key message to convey is: {key_message}.',
      sampleOutput: 'Subject: Re: Business Inquiry\n\nDear Customer,\nThank you for reaching out...',
      thumbnail: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=150',
      rating: 4.5,
      usageCount: 89,
      isPublished: true,
      createdById: admin.id,
    },
    {
      title: 'SEO Content Rewriter',
      slug: 'seo-content-rewriter',
      category: 'SEO',
      description: 'Rewrite existing text to improve clarity, flow, and keyword density for better search engine rankings.',
      prompt: 'Rewrite the following text to optimize for {keywords} while maintaining a friendly and helpful tone:\n\n{original_text}',
      sampleOutput: 'Here is the optimized content:\n\nAre you looking to improve your search engine rankings? ...',
      thumbnail: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=150',
      rating: 4.9,
      usageCount: 231,
      isPublished: true,
      createdById: admin.id,
    },
  ];

  for (const t of templates) {
    const template = await prisma.template.create({ data: t });
    console.log(`Created template: ${template.title} (${template.slug})`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
