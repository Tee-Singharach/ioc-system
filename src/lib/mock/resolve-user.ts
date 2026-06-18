import type { User } from "@/lib/types/ticket";
import {
  MOCK_ADMIN_USER,
  MOCK_MANAGERS,
  MOCK_MANAGER_USER,
  MOCK_OFFICERS,
  MOCK_OFFICER_USER,
  MOCK_STAFF_USER,
} from "@/lib/mock/data";

export function resolveMockUser(username: string): User {
  const normalized = username.trim().toLowerCase() || MOCK_STAFF_USER.username;
  if (normalized.startsWith("admin")) {
    return { ...MOCK_ADMIN_USER, username: normalized };
  }
  if (normalized.startsWith("manager")) {
    const found = MOCK_MANAGERS.find((m) => m.username === normalized);
    return { ...(found ?? MOCK_MANAGER_USER), username: normalized };
  }
  if (normalized.startsWith("officer")) {
    const found = MOCK_OFFICERS.find((o) => o.username === normalized);
    return { ...(found ?? MOCK_OFFICER_USER), username: normalized };
  }
  return { ...MOCK_STAFF_USER, username: normalized };
}
