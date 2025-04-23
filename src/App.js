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

const API_URL = 'https://script.google.com/macros/s/AKfycbznUDY4DECnSssJ6AimVPFLmI3pVrGwqhmfwJMuW62R_B1_aP_0BvdxPVpD7aduG9IV2w/exec';

function App() {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [practiceOptions, setPracticeOptions] = useState([]);
    const [entries, setEntries] = useState([{ practice: '', count: 0 }]);
    const [totals, setTotals] = useState({});
    const [streak, setStreak] = useState(0);
    const [dailyData, setDailyData] = useState({});

    // Lấy danh sách pháp tu
    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setPracticeOptions(data))
            .catch(err => console.error('Không lấy được danh sách pháp tu', err));
    }, []);

    // Tự động load thông tin từ localStorage
    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem(id));
        if (profile) {
            setName(profile.name);
            setDharmaName(profile.dharmaName);
            fetchSummary(id); // lấy tổng túc số, daily và streak
        }
    }, [id]);

    const saveProfile = () => {
        if (!id || !name || !dharmaName) {
            alert('Vui lòng nhập đầy đủ ID, Tên và Pháp Danh.');
            return;
        }
        localStorage.setItem(id, JSON.stringify({ name, dharmaName }));
        alert('Đã lưu thông tin cá nhân.');
    };

    const handleChangeEntry = (index, field, value) => {
        const updated = [...entries];
        updated[index][field] = field === 'count' ? Number(value) : value;
        setEntries(updated);
    };

    const addEntry = () => {
        setEntries([...entries, { practice: '', count: 0 }]);
    };

    const removeEntry = (index) => {
        if (entries.length === 1) {
            alert("Bạn phải có ít nhất 1 dòng.");
            return;
        }
        const updated = [...entries];
        updated.splice(index, 1);
        setEntries(updated);
    };

    const handleSubmit = async () => {
        const validEntries = entries.filter(e => e.practice && e.count > 0);
        if (!id || validEntries.length === 0) {
            alert('Vui lòng nhập ID và ít nhất một dòng hợp lệ.');
            return;
        }

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        for (const entry of validEntries) {
            const formData = new URLSearchParams();
            formData.append('id', id);
            formData.append('name', name);
            formData.append('dharmaName', dharmaName);
            formData.append('practice', entry.practice);
            formData.append('date', dateStr);
            formData.append('count', entry.count.toString());

            try {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString()
                });
            } catch (err) {
                console.error('Lỗi gửi dữ liệu:', err);
                alert('Không thể gửi dữ liệu. Vui lòng thử lại.');
                return;
            }
        }

        alert('Đã ghi nhận thành công!');
        fetchSummary(id);
        setEntries([{ practice: '', count: 0 }]);
    };

    const fetchSummary = async (userId) => {
        try {
            const response = await fetch(`${API_URL}?action=summary&id=${encodeURIComponent(userId)}`);
            const { summary, daily, streak } = await response.json();
            setTotals(summary);
            setDailyData(daily);
            setStreak(streak);
        } catch (err) {
            console.error('Không thể lấy tổng dữ liệu:', err);
        }
    };

    // Tạo dữ liệu biểu đồ
    const chartData = {
        labels: Object.keys(dailyData),
        datasets: [
            {
                label: 'Túc Số',
                data: Object.values(dailyData),
                backgroundColor: '#4B9CD3'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        }
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
            <DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} dateFormat="yyyy-MM-dd" /><br />

            <h3>📋 Nhập Túc Số Theo Pháp Tu</h3>
            {entries.map((entry, index) => (
                <div key={index} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                        value={entry.practice}
                        onChange={(e) => handleChangeEntry(index, 'practice', e.target.value)}
                    >
                        <option value="">-- Chọn Pháp Tu --</option>
                        {practiceOptions.map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min={0}
                        value={entry.count}
                        onChange={(e) => handleChangeEntry(index, 'count', e.target.value)}
                        style={{ width: 80 }}
                    />
                    <button onClick={() => removeEntry(index)} style={{ color: 'red' }}>❌</button>
                </div>
            ))}
            <button onClick={addEntry}>➕ Thêm dòng</button>

            <hr />
            <button onClick={handleSubmit}>✅ Gửi Dữ Liệu</button>

            {Object.keys(totals).length > 0 && (
                <>
                    <h4>📊 Tổng Túc Số Tính Đến Hôm Nay – Pháp Danh: {dharmaName}</h4>
                    {streak > 0 && (
                        <p>🎉 Bạn đã thực hành <strong>{streak}</strong> ngày liên tục!</p>
                    )}
                    <ul>
                        {Object.entries(totals).map(([practice, count]) => (
                            <li key={practice}>{practice}: {Number(count).toLocaleString('vi-VN')}</li>
                        ))}
                    </ul>

                    <div style={{ marginTop: 20 }}>
                        <h5>📈 Biểu đồ Túc Số Theo Ngày</h5>
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        fontFamily: 'sans-serif',
    },
};

export default App;
