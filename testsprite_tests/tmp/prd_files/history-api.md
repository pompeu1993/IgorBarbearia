# API de Histórico

## Endpoint
- `GET /api/history`

## Autenticação
- Obrigatória via token Bearer da sessão autenticada do Supabase.
- O endpoint sempre restringe a consulta ao `user_id` do usuário autenticado.

## Query Params
- `page`: número da página. Padrão `1`.
- `pageSize`: tamanho da página. Padrão `10`, máximo `50`.
- `from`: data inicial no formato `YYYY-MM-DD`.
- `to`: data final no formato `YYYY-MM-DD`.
- `serviceId`: filtra por serviço.

## Resposta de sucesso

```json
{
  "items": [
    {
      "id": "6b2f8c85-9a67-4d7b-92bc-6c6e9d8d5012",
      "date": "2026-03-31T14:00:00.000Z",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "professional": "Profissional da Casa",
      "service": {
        "id": "2e1f2b74-34d8-4c49-9b19-c0d4b27d3b7b",
        "name": "Corte Tradicional",
        "price": 35
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  },
  "filters": {
    "from": null,
    "to": null,
    "serviceId": null
  }
}
```

## Cenários de resposta

### Histórico com todos os status

```json
{
  "items": [
    { "id": "1", "date": "2026-03-12T14:00:00.000Z", "status": "PENDING", "paymentStatus": "PENDING", "professional": "Profissional da Casa", "service": { "id": "s1", "name": "Corte Tradicional", "price": 35 } },
    { "id": "2", "date": "2026-03-11T14:00:00.000Z", "status": "CONFIRMED", "paymentStatus": "PAID", "professional": "Profissional da Casa", "service": { "id": "s1", "name": "Corte Tradicional", "price": 35 } },
    { "id": "3", "date": "2026-03-10T14:00:00.000Z", "status": "CANCELLED", "paymentStatus": "CANCELLED", "professional": "Profissional da Casa", "service": { "id": "s2", "name": "Barba", "price": 20 } },
    { "id": "4", "date": "2026-03-09T14:00:00.000Z", "status": "COMPLETED", "paymentStatus": "PAID", "professional": "Profissional da Casa", "service": { "id": "s2", "name": "Barba", "price": 20 } }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 4, "totalPages": 1 },
  "filters": { "from": null, "to": null, "serviceId": null }
}
```

### Histórico filtrado por período e serviço

```json
{
  "items": [
    { "id": "2", "date": "2026-03-11T14:00:00.000Z", "status": "CONFIRMED", "paymentStatus": "PAID", "professional": "Profissional da Casa", "service": { "id": "s1", "name": "Corte Tradicional", "price": 35 } }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 },
  "filters": { "from": "2026-03-01", "to": "2026-03-31", "serviceId": "s1" }
}
```

### Usuário sem histórico

```json
{
  "items": [],
  "pagination": { "page": 1, "pageSize": 10, "total": 0, "totalPages": 1 },
  "filters": { "from": null, "to": null, "serviceId": null }
}
```

### Usuário não autenticado

```json
{
  "error": "Usuário não autenticado."
}
```
