// prisma/seed-website.js
const { PrismaClient, WebsiteTemplate } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.website.createMany({
    data: [
      {
        name: 'Acme Company',
        template: WebsiteTemplate.COMPANY_PROFILE,
        primaryDomain: 'company.example.com',
        customDomains: [],
        locales: ['en-US', 'th-TH'],
        defaultLocale: 'en-US',
        logoUrl: null,
        faviconUrl: null,
        theme: {},
        settings: {},
        isActive: true,
        publishedAt: new Date(),
      },
      {
        name: 'Acme Shop',
        template: WebsiteTemplate.ECOMMERCE,
        primaryDomain: 'shop.example.com',
        customDomains: [],
        locales: ['en-US'],
        defaultLocale: 'en-US',
        logoUrl: null,
        faviconUrl: null,
        theme: {},
        settings: {},
        isActive: true,
        publishedAt: new Date(),
      },
      {
        name: 'Future Park',
        template: WebsiteTemplate.MALL,
        primaryDomain: 'mall.example.com',
        customDomains: ['futurepark.example.com'],
        locales: ['th-TH', 'en-US'],
        defaultLocale: 'th-TH',
        logoUrl: null,
        faviconUrl: null,
        theme: {},
        settings: {},
        isActive: true,
        publishedAt: new Date(),
      },
      {
        name: 'Acme News',
        template: WebsiteTemplate.NEWS_BLOGS,
        primaryDomain: 'news.example.com',
        customDomains: [],
        locales: ['en-US'],
        defaultLocale: 'en-US',
        logoUrl: null,
        faviconUrl: null,
        theme: {},
        settings: {},
        isActive: true,
        publishedAt: new Date(),
      },
      {
        name: 'Job Portal',
        template: WebsiteTemplate.JOBS_SEARCH,
        primaryDomain: 'jobs.example.com',
        customDomains: [],
        locales: ['en-US'],
        defaultLocale: 'en-US',
        logoUrl: null,
        faviconUrl: null,
        theme: {},
        settings: {},
        isActive: true,
        publishedAt: new Date(),
      }
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seeded all website templates')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
