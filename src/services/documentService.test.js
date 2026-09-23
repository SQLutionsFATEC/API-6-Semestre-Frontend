import { describe, expect, it, vi } from 'vitest'

import api from './api'
import { fetchDocumentById } from './documentService'

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('fetchDocumentById', () => {
  it('busca o detalhe do documento pelo id e retorna o payload da API', async () => {
    const document = {
      id_documento: 42,
      nome: 'Manual.pdf',
      etiquetas: [{ id_etiqueta: 7, nome: 'Importante' }],
    }
    api.get.mockResolvedValue({ data: document })

    await expect(fetchDocumentById(42)).resolves.toEqual(document)
    expect(api.get).toHaveBeenCalledWith('/api/documentos/42/')
  })
})
