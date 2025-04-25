// api/proxy.js
export const config = {
    api: {
        bodyParser: true,
    },
};

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwzWNuKLVrIAtzoYSKlOOz1HL1BrY069qAVutulNCWuUbJmqKsZKmstysHx2_h_fweSXA/exec';

export default async function handler(req, res) {
    // 🌐 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // — GET: forward query to Google Script
    if (req.method === 'GET') {
        const qs = new URLSearchParams(req.query).toString();
        const scriptRes = await fetch(`${SCRIPT_URL}?${qs}`);
        const text = await scriptRes.text();
        res.status(200).send(text);
        return;
    }

    // — POST: forward body to Google Script
    if (req.method === 'POST') {
        // build x-www-form-urlencoded body
        const params = new URLSearchParams();
        const body = req.body;
        for (const k in body) params.append(k, body[k]);
        const scriptRes = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const text = await scriptRes.text();
        res.status(200).send(text);
        return;
    }

    res.status(405).json({ error: 'Method Not Allowed' });
}
