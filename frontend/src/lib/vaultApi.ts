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
