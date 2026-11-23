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

export async function fetchUserById(idUsuario) {
  if (!idUsuario) {
    throw new Error("O identificador do usuário é obrigatório.");
  }

  const response = await api.get(
    `/api/usuarios/${encodeURIComponent(idUsuario)}/`
  );
  return response.data;
}

export async function fetchManagedUsers(search = "") {
  const params = search ? { params: { busca: search } } : {};
  const response = await api.get("/api/usuarios/", params);
  return response.data;
}

export async function updateManagedUser(idUsuario, data) {
  if (!idUsuario) {
    throw new Error("O identificador do usuário é obrigatório.");
  }

  const response = await api.patch(
    `/api/usuarios/${encodeURIComponent(idUsuario)}/`,
    data
  );
  return response.data;
}