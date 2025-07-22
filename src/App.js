import React, { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { format, addDays, subDays } from 'date-fns';
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

    // ─── Speed Insights Script ────────────────────────────
    // Renders <SpeedInsights /> at top to inject the script tag
    // into <head>, collecting CWV data.

    // ─── 1) Load Pháp Tu once on mount ────────────────────
    useEffect(() => {
        fetch(PROXY)
            .then((r) => r.json())
            .then(setPracticeOptions)
            .catch(console.error);
    }, []);

    // ─── 2) Load profile + summary up to selectedDate ─────
    const loadData = async () => {
        if (!id) {
            alert('Vui lòng nhập ID trước.');
            return;
        }
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // ─ fetch profile
        try {
            const p = await fetch(`${PROXY}?action=profile&id=${encodeURIComponent(id)}`).then((r) =>
                r.json()
            );
            if (p) {
                setName(p.name);
                setDharmaName(p.dharmaName);
                localStorage.setItem(id, JSON.stringify(p));
            } else {
                const saved = localStorage.getItem(id);
                if (saved) {
                    const o = JSON.parse(saved);
                    setName(o.name);
                    setDharmaName(o.dharmaName);
                } else {
                    setName('');
                    setDharmaName('');
                }
            }
        } catch {
            const saved = localStorage.getItem(id);
            if (saved) {
                const o = JSON.parse(saved);
                setName(o.name);
                setDharmaName(o.dharmaName);
            }
        }

        // ─ fetch summary up to that date
        try {
            const url = `${PROXY}?action=summary&id=${encodeURIComponent(id)}&date=${dateStr}`;
            const { summary = {}, todaySummary = {}, daily = {}, streak = 0 } = await fetch(url).then(
                (r) => r.json()
            );

            setTotals(summary);
            setTodaySummary(todaySummary);
            setDailyData(daily);
            setStreak(streak);
        } catch (e) {
            console.error('Failed to load summary:', e);
            setTotals({});
            setTodaySummary({});
            setDailyData({});
            setStreak(0);
        }
    };

    // ─── 3) Whenever user changes date or ID, reload ───────
    useEffect(() => {
        if (id) loadData();
    }, [id, selectedDate]);

    // ─── Save Profile ─────────────────────────────────────
    const saveProfile = async () => {
        if (!id || !name || !dharmaName) {
            alert('Nhập đủ ID, Tên và Pháp Danh');
            return;
        }
        const res = await fetch(PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveProfile', id, name, dharmaName }),
        });
        if ((await res.text()) === 'ProfileSaved') {
            alert('Đã lưu thông tin cá nhân.');
            localStorage.setItem(id, JSON.stringify({ name, dharmaName }));
        }
    };

    // ─── Entry handlers ───────────────────────────────────
    const handleChangeEntry = (i, f, v) => {
        const u = [...entries];
        u[i][f] = v;
        setEntries(u);
    };
    const addEntry = () => setEntries([...entries, { practice: '', count: '' }]);
    const removeEntry = (i) => {
        if (entries.length === 1) {
            alert('Phải có ít nhất 1 dòng.');
            return;
        }
        const u = [...entries];
        u.splice(i, 1);
        setEntries(u);
    };
    const inc = (i) => {
        const u = [...entries];
        const v = parseInt(u[i].count, 10) || 0;
        u[i].count = String(v + 1);
        setEntries(u);
    };
    const dec = (i) => {
        const u = [...entries];
        const v = parseInt(u[i].count, 10) || 0;
        u[i].count = String(v > 0 ? v - 1 : 0);
        setEntries(u);
    };

    // ─── Submit Entries ───────────────────────────────────
    const handleSubmit = async () => {
        if (!id) {
            alert('Nhập ID trước');
            return;
        }
        const valid = entries
            .map((e) => ({ ...e, countNum: parseInt(e.count, 10) || 0 }))
            .filter((e) => e.practice && e.countNum > 0);
        if (!valid.length) {
            alert('Chọn ít nhất 1 dòng hợp lệ.');
            return;
        }

        setLoading(true);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        for (const e of valid) {
            await fetch(PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name,
                    dharmaName,
                    practice: e.practice,
                    date: dateStr,
                    count: e.countNum.toString(),
                    note: isInitialEntry ? 'tổng' : '',
                }),
            });
        }

        // save today's entries locally for easy copy later
        localStorage.setItem(
            `${id}-entries-${dateStr}`,
            JSON.stringify(valid.map((e) => ({ practice: e.practice, count: e.countNum })))
        );

        alert('Ghi thành công!');
        setEntries([{ practice: '', count: '' }]);
        setIsInitialEntry(false);
        setLoading(false);

        // reload summary/chart after submit
        await loadData();
    };

    // ─── Build 21‐day sliding window ending on selectedDate ─
    const start = subDays(selectedDate, 20);
    const days = Array.from({ length: 21 }, (_, i) =>
        format(addDays(start, i), 'yyyy-MM-dd')
    );

    const chartData = {
        labels: days,
        datasets: [
            {
                label: 'Túc Số',
                data: days.map((d) => dailyData[d] || 0),
                backgroundColor: '#4B9CD3',
            },
        ],
    };
    const chartOpts = { responsive: true, plugins: { legend: { display: false } } };

    // ─── Copy practices from previous day ─────────────────
    const copyLastEntries = () => {
        if (!id) {
            alert('Nhập ID trước');
            return;
        }
        let date = subDays(selectedDate, 1);
        for (let i = 0; i < 30; i++) {
            const key = `${id}-entries-${format(date, 'yyyy-MM-dd')}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const arr = JSON.parse(saved);
                    if (Array.isArray(arr) && arr.length) {
                        setEntries(
                            arr.map((e) => ({ practice: e.practice, count: String(e.count) }))
                        );
                        alert(`Đã copy pháp tu ngày ${format(date, 'yyyy-MM-dd')}.`);
                        return;
                    }
                } catch {}
            }
            date = subDays(date, 1);
        }
        alert('Không tìm thấy dữ liệu trước đó để copy.');
    };

    // ─── Copy Kết Quả to Clipboard ────────────────────────
    const copyResult = () => {
        if (!id) {
            alert('Chưa có kết quả để copy.');
            return;
        }
        // Build the text exactly as wanted:
        // - Title line
        // - Streak line
        // - Blank line
        // - Each practice: “Pr: hôm nay / tổng”
        // - Blank line
        // - Motivation line
        let lines = [];
        lines.push(`Túc Số Hôm Nay / Tổng Tích Lũy – ${dharmaName}`);
        if (streak > 0) {
            lines.push(`🎉 Đã thực hành ${streak} ngày liên tục!`);
        } else {
            lines.push(`🎉 Đã thực hành 0 ngày liên tục!`);
        }
        lines.push(''); // blank

        // Each practice entry
        Object.entries(totals).forEach(([practice, cum]) => {
            const todayCnt = todaySummary[practice] || 0;
            // format numbers with thousands separators using vi-VN
            const tStr = todayCnt.toLocaleString('vi-VN');
            const cStr = cum.toLocaleString('vi-VN');
            lines.push(`${practice}: ${tStr} / ${cStr}`);
        });

        lines.push(''); // blank
        lines.push('Xin tán thán và tuỷ hỷ công đức thực hành của các đạo hữu 🙏🏻');

        const text = lines.join('\n');
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert('Đã sao chép kết quả vào clipboard!');
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                alert('Không thể copy. Hãy thử lại.');
            });
    };

    // ─── Render ───────────────────────────────────────────
    return (
        <>
            {/* Speed Insights will inject the necessary <script> */}
            <SpeedInsights />

            <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
                <h2>🧘 Túc Số Tracker</h2>

                <label>ID:</label>
                <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                />
                <button onClick={loadData} style={{ marginLeft: 8 }}>
                    🔍 Tải Dữ Liệu
                </button>
                <br />

                <label>Tên:</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
                <br />
                <label>Pháp Danh:</label>
                <input value={dharmaName} onChange={(e) => setDharmaName(e.target.value)} />
                <br />
                <button onClick={saveProfile}>💾 Lưu Thông Tin</button>

                <hr />

                <label>Chọn Ngày:</label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(d) => setSelectedDate(d)}
                    dateFormat="yyyy-MM-dd"
                />
                <button onClick={copyLastEntries} style={{ marginLeft: 8 }}>
                    📄 Copy Thực hành ngày hôm trước
                </button>
                <br />

                <h3>📋 Nhập Túc Số Theo Pháp Tu</h3>
                {entries.map((e, i) => (
                    <div
                        key={i}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
                    >
                        <select
                            value={e.practice}
                            onChange={(ev) => handleChangeEntry(i, 'practice', ev.target.value)}
                        >
                            <option value="">-- Chọn Pháp Tu --</option>
                            {practiceOptions.map((p, j) => (
                                <option key={j} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>

                        <button onClick={() => dec(i)} style={{ width: 30 }}>
                            –
                        </button>
                        <input
                            type="number"
                            value={e.count}
                            placeholder="Nhập số"
                            onChange={(ev) => handleChangeEntry(i, 'count', ev.target.value)}
                            style={{ width: 60, textAlign: 'center' }}
                        />
                        <button
                            onClick={() => inc(i)}
                            style={{
                                backgroundColor: 'red',
                                color: 'white',
                                padding: '6px 12px',
                                fontSize: 14,
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}
                        >
                            Đếm
                        </button>
                        <button onClick={() => removeEntry(i)} style={{ color: 'red' }}>
                            ❌
                        </button>
                    </div>
                ))}
                <button onClick={addEntry}>➕ Thêm dòng</button>

                <div style={{ marginTop: 10 }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={isInitialEntry}
                            onChange={(e) => setIsInitialEntry(e.target.checked)}
                        />
                        Đây là số tích lũy từ trước (chỉ 1 lần)
                    </label>
                </div>

                <hr />

                {/* “Gửi dữ liệu” and “Copy Kết Quả” side by side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ padding: '6px 12px', fontSize: 14 }}
                    >
                        ✅ Gửi Dữ Liệu
                    </button>
                    <button
                        onClick={copyResult}
                        style={{
                            padding: '6px 12px',
                            fontSize: 14,
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                        }}
                    >
                        📋 Copy Kết Quả
                    </button>
                </div>
                {loading && <p>⏳ Đang xử lý...</p>}

                {id && (
                    <div style={{ marginTop: 20 }}>
                        <h4>📊 Túc Số Hôm Nay / Tổng Tích Lũy – {dharmaName}</h4>
                        {streak > 0 && (
                            <p>
                                🎉 Đã thực hành <strong>{streak}</strong> ngày liên tục!
                            </p>
                        )}
                        <ul>
                            {Object.entries(totals).map(([practice, cum]) => (
                                <li key={practice}>
                                    {practice}: <strong>{(todaySummary[practice] || 0).toLocaleString('vi-VN')}</strong> /{' '}
                                    {cum.toLocaleString('vi-VN')}
                                </li>
                            ))}
                        </ul>

                        <div style={{ marginTop: 20 }}>
                            <h5>📈 Biểu đồ Túc Số 21 Ngày</h5>
                            <Bar data={chartData} options={chartOpts} />
                        </div>

                        {/* Motivation sentence */}
                        <p style={{ marginTop: 20, fontStyle: 'italic' }}>
                            Xin tán thán và tuỷ hỷ công đức thực hành của các đạo hữu 🙏🏻
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

export default App;
