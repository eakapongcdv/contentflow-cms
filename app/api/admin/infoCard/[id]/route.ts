import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(_:Request, { params }:any){ const item = await prisma.infoCard.findUnique({ where: { id: params.id } }); return NextResponse.json(item); }
export async function PUT(req:Request, { params }:any){ const data = await req.json(); const item = await prisma.infoCard.update({ where: { id: params.id }, data }); return NextResponse.json(item); }
export async function DELETE(_:Request, { params }:any){ await prisma.infoCard.delete({ where: { id: params.id } }); return NextResponse.json({ ok:true }); }
