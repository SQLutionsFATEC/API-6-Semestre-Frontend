import api from "./api";

export async function updateProfile(data) {
  const response = await api.patch("/api/usuarios/", data);
  return response.data;
}