const cors = {
  "Access-Control-Allow-Origin": "https://rudwnsgus13-ops.github.io",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null,{headers:cors});
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ok:true,service:"personal-os-price",version:"1.0"},{headers:cors});
    }
    return Response.json({
      ok:true,
      service:"personal-os-price",
      message:"Price backend is ready",
      endpoints:["/health"]
    },{headers:cors});
  }
};
