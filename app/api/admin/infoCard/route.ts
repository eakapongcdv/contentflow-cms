import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(){ const items = await prisma.infoCard.findMany({ orderBy: { sort: "asc" } }); return NextResponse.json(items); }
export async function POST(req:Request){ const data = await req.json(); const item = await prisma.infoCard.create({ data }); return NextResponse.json(item); }
