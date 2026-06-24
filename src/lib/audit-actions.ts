/** ป้าย action สำหรับแสดงใน UI (ค่าใน DB เป็นภาษาไทยอยู่แล้ว) */
export function auditActionLabel(action: string) {
  return action;
}

export function auditActorEmail(username: string) {
  return `${username}@ioc.local`;
}
