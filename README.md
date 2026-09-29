# Kopa Web

Vue 3 frontend powered by Vite, Tailwind CSS, Vue Router, Pinia, and Axios.

## Development

```sh
npm install
cp .env.example .env
npm run dev
```

API requests use `/api` by default, which the Vite development server proxies to
Laravel at `http://localhost:8000`. Set `VITE_API_BASE_URL` when the API is hosted
at a different origin.

Demo login: company `kiboga-capital`, email `owner@kiboga.ug`, password `password`.
