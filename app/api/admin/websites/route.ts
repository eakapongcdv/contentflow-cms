// app/api/admin/websites/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const sites = await prisma.website.findMany({
    where: { isActive: true },
    orderBy: [{ name: 'asc' }]
  })
  return NextResponse.json({ items: sites })
}
