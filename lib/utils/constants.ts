import type { Role } from "@/lib/types/faltas";

export const roles: Array<{ key: Role; labelKey: string }> = [
  { key: "E", labelKey: "login.student" },
  { key: "P", labelKey: "login.teacher" },
  { key: "D", labelKey: "login.director" },
  { key: "A", labelKey: "login.admin" },
];


