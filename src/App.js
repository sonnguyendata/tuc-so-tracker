import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = 'https://script.google.com/macros/s/AKfycbyzfEGXQSdplGfXY9dskSsKAZu8IAYgiEB7fJTn9MXfDHddCzA3Vc9VGY8vmLd2cx753A/exec';

function App() {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [dharmaName, setDharmaName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [practiceOptions, setPracticeOptions] = useState([]);
    const [entries, setEntries] = useState([{ practice: '', count: 0 }]);
    const [totals, setTotals] = useState({});

    // Lấy danh sách pháp tu
    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setPracticeOptions(data))
            .catch(err => console.error('Không lấy được danh sách pháp tu', err));
    }, []);

    // Load profile theo ID nếu có
    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem(id));
        if (profile) {
            setName(profile.name);
            setDharmaName(profile.dharmaName);
        }
    }, [id]);

    const saveProfile = () => {
        if (!id || !name || !dharmaName) {
            alert('Vui lòng nhập đầy đủ ID, Tên, Pháp Danh.');
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

    const handleSubmit = async () => {
        const validEntries = entries.filter(e => e.practice && e.count > 0);
        if (!id || validEntries.length === 0) {
            alert('Vui lòng nhập ID và ít nhất một pháp tu hợp lệ.');
            return;
        }

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const postPromises = validEntries.map((entry) =>
            fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    id,
                    name,
                    dharmaName,
                    practice: entry.practice,
                    date: dateStr,
                    count: entry.count,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        );

        try {
            await Promise.all(postPromises);
            const newTotals = {};
            validEntries.forEach(entry => {
                if (!newTotals[entry.practice]) newTotals[entry.practice] = 0;
                newTotals[entry.practice] += entry.count;
            });
            setTotals(newTotals);
            setEntries([{ practice: '', count: 0 }]);
            alert('Đã ghi nhận thành công!');
        } catch (err) {
            console.error('Lỗi gửi dữ liệu:', err);
            alert('Không thể gửi dữ liệu. Vui lòng thử lại.');
        }
    };

    return (
        <div style={styles.container}>
            <h2>🧘 Túc Số Tracker</h2>

            <label>ID:</label>
            <input value={id} onChange={e => setId(e.target.value)} />
            <br />

            <label>Tên:</label>
            <input value={name} onChange={e => setName(e.target.value)} />
            <br />

            <label>Pháp Danh:</label>
            <input value={dharmaName} onChange={e => setDharmaName(e.target.value)} />
            <br />

            <button onClick={saveProfile}>💾 Lưu Thông Tin</button>

            <hr />

            <label>Chọn Ngày:</label>
            <DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} dateFormat="yyyy-MM-dd" />
            <br />

            <h3>📋 Nhập Túc Số Theo Pháp Tu</h3>
            {entries.map((entry, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                    <select
                        value={entry.practice}
                        onChange={(e) => handleChangeEntry(index, 'practice', e.target.value)}
                    >
                        <option value="">-- Chọn Pháp Tu --</option>
                        {practiceOptions.map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                        ))}
                    </select>
                    &nbsp;
                    <input
                        type="number"
                        min={0}
                        value={entry.count}
                        onChange={(e) => handleChangeEntry(index, 'count', e.target.value)}
                        style={{ width: 80 }}
                    />
                </div>
            ))}
            <button onClick={addEntry}>➕ Thêm dòng</button>

            <hr />

            <button onClick={handleSubmit}>✅ Gửi Dữ Liệu</button>

            {Object.keys(totals).length > 0 && (
                <>
                    <h4>📊 Tổng Túc Số Hôm Nay:</h4>
                    <ul>
                        {Object.entries(totals).map(([practice, count]) => (
                            <li key={practice}>{practice}: {count}</li>
                        ))}
                    </ul>
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
