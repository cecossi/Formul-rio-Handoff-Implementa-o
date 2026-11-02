exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'NETLIFY_API_TOKEN não configurado' }) };
  }

  const siteId = '20dccb4e-f50d-482d-b989-cb071bff0351';
  const forms = ['handoff-cpj3c', 'handoff-officeadv'];
  const allSubmissions = [];

  for (const formName of forms) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.netlify.com/api/v1/sites/${siteId}/submissions?per_page=100&page=${page}&form_name=${formName}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) break;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        for (const sub of data) {
          allSubmissions.push({
            id: sub.id,
            produto: formName === 'handoff-cpj3c' ? 'CPJ-3C' : 'Office ADV',
            escritorio: sub.data?.nome_escritorio || sub.data?.escritorio || '—',
            implementador: sub.data?.implementador || '—',
            data_handoff: sub.data?.data_handoff || sub.created_at?.slice(0, 10) || '—',
            tag_alarme: sub.data?.tag_alarme || '',
            criado_em: sub.created_at || '',
          });
        }
        if (data.length < 100) hasMore = false;
        else page++;
      }
    }
  }

  allSubmissions.sort((a, b) => (b.criado_em > a.criado_em ? 1 : -1));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(allSubmissions),
  };
};
