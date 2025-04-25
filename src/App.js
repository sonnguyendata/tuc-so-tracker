import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PROXY = '/api/proxy';

function App() {
    // ─── State ─────────────────────────────────────────────
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [practiceOptions, setPracticeOptions] = useState([]);
    const [entries, setEntries] = useState([{ practice: '', count: '' }]);
    const [isInitialEntry, setIsInitialEntry] = useState(false);
    const [loading, setLoading] = useState(false);

    const [totals, setTotals] = useState({});
    const [todaySummary, setTodaySummary] = useState({});
    const [dailyData, setDailyData] = useState({});
    const [streak, setStreak] = useState(0);

    // ─── Load Pháp Tu ───────────────────────────────────────
    useEffect(() => {
        fetch(PROXY)
            .then(r => r.json())
            .then(setPracticeOptions)
            .catch(console.error);
    }, []);

    // ─── Load Profile + Summary khi ID thay đổi ────────────
    useEffect(() => {
        if (!id) {
            // reset mọi thứ khi xóa ID
            setName(''); setDharmaName('');
            setTotals({}); setTodaySummary({}); setDailyData({}); setStreak(0);
            return;
        }

        // 1) profile
        fetch(`${PROXY}?action=profile&id=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(p => {
                if (p) {
                    setName(p.name);
                    setDharmaName(p.dharmaName);
                    localStorage.setItem(id, JSON.stringify(p));
                } else {
                    const saved = localStorage.getItem(id);
                    if (saved) {
                        const obj = JSON.parse(saved);
                        setName(obj.name);
                        setDharmaName(obj.dharmaName);
                    }
                }
            })
            .catch(() => {
                const saved = localStorage.getItem(id);
                if (saved) {
                    const obj = JSON.parse(saved);
                    setName(obj.name);
                    setDharmaName(obj.dharmaName);
                }
            });

        // 2) summary
        fetch(`${PROXY}?action=summary&id=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(({ summary = {}, todaySummary = {}, daily = {}, streak = 0 }) => {
                setTotals(summary);
                setTodaySummary(todaySummary);
                setDailyData(daily);
                setStreak(streak);
            })
            .catch(console.error);
    }, [id]);

    // ─── Save Profile ───────────────────────────────────────
    const saveProfile = async () => {
        if (!id || !name || !dharmaName) {
            return alert('Nhập đủ ID, Tên và Pháp Danh');
        }
        const res = await fetch(PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveProfile', id, name, dharmaName })
        });
        if ((await res.text()) === 'ProfileSaved') {
            alert('Đã lưu thông tin cá nhân.');
            localStorage.setItem(id, JSON.stringify({ name, dharmaName }));
        }
    };

    // ─── Entries handlers ─────────────────────────────────
    const handleChangeEntry = (i, f, v) => {
        const u = [...entries]; u[i][f] = v; setEntries(u);
    };
    const addEntry = () => setEntries([...entries, { practice: '', count: '' }]);
    const removeEntry = i => {
        if (entries.length === 1) {
            alert('Phải có ít nhất 1 dòng.');
            return;
        }
        const u = [...entries]; u.splice(i, 1); setEntries(u);
    };
    const inc = i => {
        const u = [...entries];
        const v = parseInt(u[i].count, 10) || 0;
        u[i].count = String(v + 1);
        setEntries(u);
    };
    const dec = i => {
        const u = [...entries];
        const v = parseInt(u[i].count, 10) || 0;
        u[i].count = String(v > 0 ? v - 1 : 0);
        setEntries(u);
    };

    // ─── Submit entries ───────────────────────────────────
    const handleSubmit = async () => {
        if (!id) return alert('Nhập ID trước');
        const valid = entries
            .map(e => ({ ...e, countNum: parseInt(e.count, 10) || 0 }))
            .filter(e => e.practice && e.countNum > 0);
        if (!valid.length) return alert('Chọn ít nhất 1 dòng hợp lệ.');

        setLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        for (const e of valid) {
            await fetch(PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id, name, dharmaName,
                    practice: e.practice,
                    date: dateStr,
                    count: e.countNum.toString(),
                    note: isInitialEntry ? 'tổng' : ''
                })
            });
        }
        alert('Ghi thành công!');
        setEntries([{ practice: '', count: '' }]);
        setIsInitialEntry(false);
        setLoading(false);

        // reload summary immediately
        const resp = await fetch(`${PROXY}?action=summary&id=${encodeURIComponent(id)}`);
        const { summary = {}, todaySummary = {}, daily = {}, streak = 0 } = await resp.json();
        setTotals(summary);
        setTodaySummary(todaySummary);
        setDailyData(daily);
        setStreak(streak);
    };

    // ─── Chart setup ─────────────────────────────────────
    const dates = Object.keys(dailyData).sort();
    const chartData = {
        labels: dates,
        datasets: [{ label: 'Túc Số', data: dates.map(d => dailyData[d]), backgroundColor: '#4B9CD3' }]
    };
    const chartOptions = { responsive: true, plugins: { legend: { display: false } } };

    // ─── Render ──────────────────────────────────────────
    return (
        <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
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
            <DatePicker selected={selectedDate} onChange={d => setSelectedDate(d)} dateFormat="yyyy-MM-dd" /><br />

            <h3>📋 Nhập Túc Số Theo Pháp Tu</h3>
            {entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <select value={e.practice} onChange={ev => handleChangeEntry(i, 'practice', ev.target.value)}>
                        <option value="">-- Chọn Pháp Tu --</option>
                        {practiceOptions.map((p, j) => <option key={j} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => dec(i)} style={{ width: 30 }}>–</button>
                    <input
                        type="number"
                        value={e.count}
                        placeholder="Nhập số"
                        onChange={ev => handleChangeEntry(i, 'count', ev.target.value)}
                        style={{ width: 60, textAlign: 'center' }}
                    />
                    <button onClick={() => inc(i)} style={{ width: 30 }}>+</button>
                    <button onClick={() => removeEntry(i)} style={{ color: 'red' }}>❌</button>
                </div>
            ))}
            <button onClick={addEntry}>➕ Thêm dòng</button>
            <div style={{ marginTop: 10 }}>
                <label>
                    <input type="checkbox" checked={isInitialEntry} onChange={e => setIsInitialEntry(e.target.checked)} />
                    Đây là số tích lũy từ trước (chỉ 1 lần)
                </label>
            </div>
            <hr />
            <button onClick={handleSubmit} disabled={loading}>✅ Gửi Dữ Liệu</button>
            {loading && <p>⏳ Đang xử lý...</p>}

            {/* Summary luôn hiển thị nếu ID tồn tại */}
            {id && (
                <div style={{ marginTop: 20 }}>
                    <h4>📊 Túc Số Hôm Nay / Tổng Tích Lũy – {dharmaName}</h4>
                    {streak > 0 && <p>🎉 Bạn đã thực hành <strong>{streak}</strong> ngày liên tục!</p>}
                    <ul>
                        {Object.entries(totals).map(([practice, cum]) => (
                            <li key={practice}>
                                {practice}: <strong>{(todaySummary[practice] || 0).toLocaleString('vi-VN')}</strong> / {cum.toLocaleString('vi-VN')}
                            </li>
                        ))}
                    </ul>
                    <div style={{ marginTop: 20 }}>
                        <h5>📈 Biểu đồ Túc Số Theo Ngày</h5>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
