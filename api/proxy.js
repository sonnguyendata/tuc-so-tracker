export const config = {
  api: {
    bodyParser: true, // Cho phép parse JSON từ client
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const params = new URLSearchParams();
    for (const key in req.body) {
      params.append(key, req.body[key]);
    }

      const response = await fetch('https://script.google.com/macros/s/AKfycbwzWNuKLVrIAtzoYSKlOOz1HL1BrY069qAVutulNCWuUbJmqKsZKmstysHx2_h_fweSXA/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const result = await response.text();
    res.status(200).json({ message: result });
  } catch (error) {
    console.error('Lỗi proxy gửi lên Google Script:', error);
    res.status(500).json({ error: 'Gửi thất bại từ proxy' });
  }
}
