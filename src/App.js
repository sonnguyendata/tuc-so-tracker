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

function App() {
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

    // load pháp tu
    useEffect(() => {
        fetch('/api/proxy')
            .then(r => r.json())
            .then(setPracticeOptions)
            .catch(console.error);
    }, []);

    // load profile + history
    useEffect(() => {
        if (!id) {
            setName(''); setDharmaName('');
            setTotals({}); setTodaySummary({}); setDailyData({}); setStreak(0);
            return;
        }
        // profile
        fetch(`/api/proxy?action=profile&id=${encodeURIComponent(id)}`)
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
        // summary
        fetch(`/api/proxy?action=summary&id=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(({ summary = {}, todaySummary = {}, daily = {}, streak = 0 }) => {
                setTotals(summary);
                setTodaySummary(todaySummary);
                setDailyData(daily);
                setStreak(streak);
            })
            .catch(console.error);
    }, [id]);

    const saveProfile = async () => {
        if (!id || !name || !dharmaName) {
            alert('Nhập đủ ID, Tên, Pháp Danh');
            return;
        }
        const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveProfile',
                id, name, dharmaName
            })
        });
        if ((await res.text()) === 'ProfileSaved') {
            alert('Đã lưu profile');
            localStorage.setItem(id, JSON.stringify({ name, dharmaName }));
        }
    };

    const handleChangeEntry = (i, f, v) => {
        const u = [...entries]; u[i][f] = v; setEntries(u);
    };
    const addEntry = () => setEntries([...entries, { practice: '', count: '' }]);
    const removeEntry = i => {
        if (entries.length === 1) { alert('Phải có ít nhất 1 dòng.'); return; }
        const u = [...entries]; u.splice(i, 1); setEntries(u);
    };
    const inc = i => { const u = [...entries]; const v = parseInt(u[i].count, 10) || 0; u[i].count = (v + 1).toString(); setEntries(u); };
    const dec = i => { const u = [...entries]; const v = parseInt(u[i].count, 10) || 0; u[i].count = (v > 0 ? v - 1 : 0).toString(); setEntries(u); };

    const handleSubmit = async () => {
        if (!id) { alert('Nhập ID trước'); return; }
        const valid = entries
            .map(e => ({ ...e, countNum: parseInt(e.count, 10) || 0 }))
            .filter(e => e.practice && e.countNum > 0);
        if (!valid.length) { alert('Chọn ít nhất 1 dòng hợp lệ.'); return; }
        setLoading(true);
        const dstr = format(selectedDate, 'yyyy-MM-dd');
        for (const e of valid) {
            await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id, name, dharmaName,
                    practice: e.practice,
                    date: dstr,
                    count: e.countNum.toString(),
                    note: isInitialEntry ? 'tổng' : ''
                })
            });
        }
        alert('Ghi thành công!');
        setEntries([{ practice: '', count: '' }]);
        setIsInitialEntry(false);
        setLoading(false);
        // reload summary
        fetch(`/api/proxy?action=summary&id=${encodeURIComponent(id)}`)
            .then(r => r.json())
            .then(({ summary = {}, todaySummary = {}, daily = {}, streak = 0 }) => {
                setTotals(summary);
                setTodaySummary(todaySummary);
                setDailyData(daily);
                setStreak(streak);
            })
            .catch(console.error);
    };

    // chart data
    const sortedDates = Object.keys(dailyData).sort();
    const chartData = {
        labels: sortedDates,
        datasets: [{
            label: 'Túc Số',
            data: sortedDates.map(d => dailyData[d]),
            backgroundColor: '#4B9CD3'
        }]
    };
    const chartOptions = { responsive: true, plugins: { legend: { display: false } } };

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
                        <option value="">--Chọn Pháp Tu--</option>
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
                    <input
                        type="checkbox"
                        checked={isInitialEntry}
                        onChange={e => setIsInitialEntry(e.target.checked)}
                    />
                    Đây là số tích lũy từ trước (chỉ 1 lần)
                </label>
            </div>
            <hr />
            <button onClick={handleSubmit} disabled={loading}>✅ Gửi Dữ Liệu</button>
            {loading && <p>⏳ Đang xử lý...</p>}

            {id && (
                <div style={{ marginTop: 20 }}>
                    <h4>📊 Túc Số Hôm Nay / Tổng Tích Lũy – {dharmaName}</h4>
                    {streak > 0 && <p>🎉 Bạn đã thực hành <strong>{streak}</strong> ngày liên tục!</p>}
                    <ul>
                        {Object.entries(totals).map(([p, c]) => (
                            <li key={p}>
                                {p}: <strong>{(todaySummary[p] || 0).toLocaleString('vi-VN')}</strong> / {c.toLocaleString('vi-VN')}
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
