import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(_:Request, { params }:any){ const item = await prisma.brand.findUnique({ where: { id: params.id } }); return NextResponse.json(item); }
export async function PUT(req:Request, { params }:any){ const data = await req.json(); const item = await prisma.brand.update({ where: { id: params.id }, data }); return NextResponse.json(item); }
export async function DELETE(_:Request, { params }:any){ await prisma.brand.delete({ where: { id: params.id } }); return NextResponse.json({ ok:true }); }
