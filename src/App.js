import React, { useState } from 'react';
import { format } from 'date-fns';

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzh-Q4TuRKU1hEP2xdEHa5-dvLmpiKXF9IWS6goS1_GYWgwJM5J8H30A2x6WAEaMnvj4A/exec';

function App() {
    const [name, setName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [practice, setPractice] = useState('');
    const [todayCount, setTodayCount] = useState(0);
    const [total, setTotal] = useState(0);

    const handleAdd = async () => {
        if (!name || !dharmaName || !practice || todayCount <= 0) {
            alert('Vui lòng điền đầy đủ thông tin và số túc > 0.');
            return;
        }

        const date = format(new Date(), 'yyyy-MM-dd');

        const data = {
            name,
            dharmaName,
            practice,
            date,
            count: todayCount,
        };

        try {
            await fetch(SHEET_API_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            setTotal(prev => prev + todayCount);
            setTodayCount(0);
            alert('Đã ghi nhận túc số!');
        } catch (err) {
            console.error('Gửi dữ liệu thất bại', err);
            alert('Lỗi khi gửi dữ liệu.');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
            <h2>Phần Mềm Đếm Túc Số</h2>
            <label>Tên:</label>
            <input value={name} onChange={e => setName(e.target.value)} />
            <br />

            <label>Pháp Danh:</label>
            <input value={dharmaName} onChange={e => setDharmaName(e.target.value)} />
            <br />

            <label>Pháp Tu:</label>
            <input value={practice} onChange={e => setPractice(e.target.value)} />
            <br />

            <label>Số Túc Hôm Nay:</label>
            <input
                type="number"
                value={todayCount}
                onChange={e => setTodayCount(Number(e.target.value))}
                min={0}
            />
            <br />

            <button onClick={handleAdd}>Cộng vào Tổng</button>

            <h3>Tổng Túc Số: {total}</h3>
        </div>
    );
}

export default App;
