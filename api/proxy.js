export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(req.body).toString()
        });

        const result = await response.text();
        res.status(200).json({ message: result });
    } catch (error) {
        console.error('Lỗi proxy gửi lên Google Script:', error);
        res.status(500).json({ error: 'Gửi thất bại từ proxy' });
    }
}
