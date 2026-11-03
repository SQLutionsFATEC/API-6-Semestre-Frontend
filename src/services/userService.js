import api from "./api";

export async function deleteOwnAccount() {
  await api.delete("/api/usuarios/");
}

export async function updateProfile(data) {
  const response = await api.patch("/api/usuarios/", data);
  return response.data;
}

export async function fetchUserProfile() {
  const response = await api.get("/api/perfil/");
  return response.data;
}
