import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(){ const items = await prisma.heroSlide.findMany({ orderBy: { sort: "asc" } }); return NextResponse.json(items); }
export async function POST(req:Request){ const data = await req.json(); const item = await prisma.heroSlide.create({ data }); return NextResponse.json(item); }
