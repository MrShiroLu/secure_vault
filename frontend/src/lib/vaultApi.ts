import { api } from "./api";

export type VaultItemType =
  | "iban"
  | "kredi_karti"
  | "tc_kimlik"
  | "eposta"
  | "telefon";

export type VaultListItem = {
  id: number;
  name: string;
  type: VaultItemType;
  preview: string;
  signed: boolean;
  signed_at: string | null;
  created_at: string;
};

export type VaultDetailItem = {
  id: number;
  name: string;
  type: VaultItemType;
  value: string;
  integrity: "ok";
  signed: boolean;
  signed_at: string | null;
  created_at: string;
};

export type SignatureVerification = {
  valid: boolean;
  reason?: string;
  signed_by?: string;
  signed_at: string | null;
  public_key_summary?: string;
  sha256?: string;
};

export type ShareTokenResponse = {
  token: string;
  expires_at: string;
};

export type SharedDocumentVerification = {
  name: string;
  type: VaultItemType;
  valid: boolean;
  signed_by: string;
  signed_at: string | null;
  sha256: string;
};

export type AddVaultItemPayload = {
  name: string;
  type: VaultItemType;
  value: string;
};

export async function addVaultItem(payload: AddVaultItemPayload) {
  const response = await api.post<{ id: number; message: string }>(
    "/vault/add",
    payload,
  );
  return response.data;
}

export async function listVaultItems() {
  const response = await api.get<VaultListItem[]>("/vault/list");
  return response.data;
}

export async function getVaultItem(id: string) {
  const response = await api.get<VaultDetailItem>(`/vault/view/${id}`);
  return response.data;
}

export async function deleteVaultItem(id: number) {
  const response = await api.delete<{ message: string }>(`/vault/${id}`);
  return response.data;
}

export async function signVaultItem(id: number) {
  const response = await api.post<{ message: string; signed_at: string }>(
    `/vault/sign/${id}`,
  );
  return response.data;
}

export async function verifyVaultItem(id: number) {
  const response = await api.get<SignatureVerification>(`/vault/verify/${id}`);
  return response.data;
}

export async function createShareToken(id: number) {
  const response = await api.post<ShareTokenResponse>(
    `/vault/share/create/${id}`,
  );
  return response.data;
}

export async function getSharedDocument(token: string) {
  const response = await api.get<SharedDocumentVerification>(
    `/vault/share/${token}`,
  );
  return response.data;
}
