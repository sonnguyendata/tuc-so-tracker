import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API = 'https://script.google.com/macros/s/AKfycbwzWNuKLVrIAtzoYSKlOOz1HL1BrY069qAVutulNCWuUbJmqKsZKmstysHx2_h_fweSXA/exec';

function App() {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [practiceOptions, setPracticeOptions] = useState([]);
    // 2️⃣ count khởi tạo rỗng, không 0
    const [entries, setEntries] = useState([{ practice: '', count: '' }]);
    const [totals, setTotals] = useState({});
    const [streak, setStreak] = useState(0);
    const [dailyData, setDailyData] = useState({});
    const [loading, setLoading] = useState(false);
    // 3️⃣ nút toggle initial entry
    const [isInitialEntry, setIsInitialEntry] = useState(false);

    useEffect(() => {
        fetch(API).then(r => r.json()).then(setPracticeOptions);
    }, []);

    useEffect(() => {
        if (!id) return;
        // 1️⃣ fetch profile
        fetch(`${API}?action=profile&id=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(p => {
                if (p) {
                    setName(p.name);
                    setDharmaName(p.dharmaName);
                }
            });
    }, [id]);

    // helpers
    const saveProfile = async () => {
        if (!id || !name || !dharmaName) {
            return alert('Nhập ID, Tên, Pháp Danh');
        }
        const body = new URLSearchParams({
            action: 'saveProfile', id, name, dharmaName
        }).toString();
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        if (await res.text() === 'ProfileSaved') alert('Đã lưu profile');
    };

    const handleChangeEntry = (i, f, v) => {
        const u = [...entries]; u[i][f] = v; setEntries(u);
    };
    const addEntry = () => setEntries([...entries, { practice: '', count: '' }]);
    const removeEntry = i => { if (entries.length > 1) { const u = [...entries]; u.splice(i, 1); setEntries(u); } };
    // 3️⃣ tăng/giảm
    const inc = i => { const u = [...entries]; const v = parseInt(u[i].count, 10) || 0; u[i].count = v + 1; setEntries(u); };
    const dec = i => { const u = [...entries]; const v = parseInt(u[i].count, 10) || 0; u[i].count = v > 0 ? v - 1 : 0; setEntries(u); };

    const handleSubmit = async () => {
        if (!id) return alert('Nhập ID');
        const valid = entries
            .map(e => ({ ...e, countNum: parseInt(e.count, 10) || 0 }))
            .filter(e => e.practice && e.countNum > 0);
        if (!valid.length) return alert('Chọn ít nhất 1 dòng');
        setLoading(true);
        const dstr = format(selectedDate, 'yyyy-MM-dd');
        for (const e of valid) {
            await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    id, name, dharmaName,
                    practice: e.practice,
                    date: dstr,
                    count: e.countNum.toString(),
                    note: isInitialEntry ? 'tổng' : ''
                }).toString()
            });
        }
        alert('Ghi thành công!');
        setEntries([{ practice: '', count: '' }]);
        setIsInitialEntry(false);
        setLoading(false);
        // (Bạn có thể fetch lại summary ở đây nếu cần)
    };

    return (
        <div style={styles.container}>
            <h2>🧘 Túc Số Tracker</h2>
            <label>ID:</label>
            <input value={id} onChange={e => setId(e.target.value)} /><br />
            <label>Tên:</label>
            <input value={name} onChange={e => setName(e.target.value)} /><br />
            <label>Pháp Danh:</label>
            <input value={dharmaName} onChange={e => setDharmaName(e.target.value)} /><br />
            <button onClick={saveProfile}>💾 Lưu Thông Tin</button>
            <hr />

            <label>Chọn Ngày:</label>
            <DatePicker selected={selectedDate}
                onChange={d => setSelectedDate(d)}
                dateFormat="yyyy-MM-dd" /><br />

            <h3>📋 Nhập Túc Số Theo Pháp Tu</h3>
            {entries.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <select value={entry.practice}
                        onChange={e => handleChangeEntry(i, 'practice', e.target.value)}>
                        <option value="">--Chọn pháp tu--</option>
                        {practiceOptions.map((p, j) => <option key={j} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => dec(i)} style={{ width: 30 }}>–</button>
                    <input
                        type="text"
                        value={entry.count}
                        readOnly
                        placeholder="Nhập số"
                        style={{ width: 50, textAlign: 'center' }}
                    />
                    <button onClick={() => inc(i)} style={{ width: 30 }}>+</button>
                    <button onClick={() => removeEntry(i)} style={{ color: 'red' }}>❌</button>
                </div>
            ))}
            <button onClick={addEntry}>➕ Thêm dòng</button>
            <div style={{ marginTop: 10 }}>
                <label>
                    <input
                        type="checkbox"
                        checked={isInitialEntry}
                        onChange={e => setIsInitialEntry(e.target.checked)}
                    />
                    Đây là số tích lũy từ trước (chỉ nhập 1 lần)
                </label>
            </div>

            <hr />
            <button onClick={handleSubmit}>✅ Gửi Dữ Liệu</button>
            {loading && <p>⏳ Đang xử lý...</p>}
        </div>
    );
}

const styles = {
    container: { maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }
};

export default App;
