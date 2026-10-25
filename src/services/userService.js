import api from "./api";

export async function deleteOwnAccount() {
  await api.delete("/api/usuarios/");
}
