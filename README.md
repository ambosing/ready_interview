# Hirey
interview helper

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api
- SQLite data is persisted in the `backend_data` Docker volume.

For production, replace `JWT_SECRET` and `JWT_REFRESH_SECRET` in
`docker-compose.yml` with strong secrets.
