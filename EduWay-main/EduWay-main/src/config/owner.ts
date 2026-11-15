/**
 * Official Owner Configuration for Eduway
 * The designated Owner UID is authoritative and immutable.
 */
export const OWNER_UID = 'ZAzbViaemRbjyA4QpHsqOKjzhcu1';

export function isOwnerUser(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return uid === OWNER_UID;
}
