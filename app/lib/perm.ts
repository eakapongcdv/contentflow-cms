// app/lib/perm.ts
import { prisma } from "@/app/lib/prisma";
import type { AccessControl, AclAction, AclEffect, AclSubject, Role } from "@prisma/client";

export type Rule = Pick<AccessControl, "resource" | "action" | "effect">;

/** ดึงกฎทั้งหมดที่มีผลต่อ user บน website */
export async function getEffectiveRulesForUser(opts: {
  userId: string;
  userRole: Role;
  websiteId: string;
}) {
  const { userId, userRole, websiteId } = opts;

  // กลุ่มของผู้ใช้บนเว็บนี้ (หรือกลุ่ม global ถ้าคุณออกแบบให้ websiteId เป็น null)
  const groups = await prisma.userGroupMember.findMany({
    where: { userId, group: { OR: [{ websiteId }, { websiteId: null }] } },
    select: { groupId: true },
  });
  const groupIds = groups.map((g) => g.groupId);

  const rows = await prisma.accessControl.findMany({
    where: {
      websiteId,
      OR: [
        { subjectType: "USER", subjectId: userId },
        { subjectType: "GROUP", subjectId: { in: groupIds.length ? groupIds : ["_none_"] } },
        { subjectType: "ROLE", subjectId: userRole as unknown as string },
      ],
    },
    select: { resource: true, action: true, effect: true },
  });

  return rows as Rule[];
}

/** ตัวตรวจสิทธิ์ (ฝั่งเซิร์ฟเวอร์ก็ใช้ได้) */
export function makeCan(rules: Rule[]) {
  return (action: AclAction | "ALL", resource: string) => {
    // match แบบ exact > prefix* > "*" และ action exact > ALL; DENY ชนะ
    const scored = rules
      .filter((r) => actionMatch(action, r.action))
      .filter((r) => resourceMatch(resource, r.resource))
      .map((r) => ({
        r,
        score:
          (r.action === "ALL" ? 0 : 10) +
          (r.resource === "*"
            ? 0
            : r.resource.endsWith("*")
            ? 5 + r.resource.length // prefix
            : 20 + r.resource.length), // exact
      }))
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return false;

    // กฎที่เฉพาะสุดตัวบนสุด
    const top = scored[0].r;
    if (top.effect === "DENY") return false;
    // มี ALLOW ด้านบนสุด
    return true;
  };
}

function actionMatch(need: string, have: string) {
  return have === "ALL" || have === need;
}

function resourceMatch(target: string, pattern: string) {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) return target.startsWith(pattern.slice(0, -1));
  return target === pattern;
}
