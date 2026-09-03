export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { results } = await env.DB.prepare("SELECT * FROM users LIMIT 1").all();
    return Response.json({ users: results });
  },
};

export interface Env {
  DB: D1Database;
}
