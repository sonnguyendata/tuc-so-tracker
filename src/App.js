import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = 'https://script.google.com/macros/s/AKfycbznUDY4DECnSssJ6AimVPFLmI3pVrGwqhmfwJMuW62R_B1_aP_0BvdxPVpD7aduG9IV2w/exec';

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

    // Tự động load profile từ localStorage
    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem(id));
        if (profile) {
            setName(profile.name);
            setDharmaName(profile.dharmaName);
            fetchTotalSummary(id); // lấy tổng túc số khi nhập ID
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
        const submitResults = [];

        for (const entry of validEntries) {
            const formData = new URLSearchParams();
            formData.append('id', id);
            formData.append('name', name);
            formData.append('dharmaName', dharmaName);
            formData.append('practice', entry.practice);
            formData.append('date', dateStr);
            formData.append('count', entry.count.toString());

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString()
                });

                const text = await res.text();
                submitResults.push({ practice: entry.practice, count: entry.count, result: text });
            } catch (err) {
                console.error('Lỗi gửi dữ liệu:', err);
                alert('Không thể gửi dữ liệu. Vui lòng thử lại.');
                return;
            }
        }

        alert('Đã ghi nhận thành công!');
        fetchTotalSummary(id); // cập nhật lại tổng sau khi gửi
        setEntries([{ practice: '', count: 0 }]);
    };

    const fetchTotalSummary = async (userId) => {
        try {
            const response = await fetch(`${API_URL}?action=summary&id=${encodeURIComponent(userId)}`);
            const data = await response.json();
            setTotals(data);
        } catch (err) {
            console.error('Không thể lấy tổng túc số:', err);
        }
    };

    return (
        <div style={styles.container}>
            <h2>🧘 Túc Số Tracker - Maratika Việt Nam</h2>

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
                    <h4>📊 Tổng Túc Số Tính Đến Hôm Nay:</h4>
                    <ul>
                        {Object.entries(totals).map(([practice, count]) => (
                            <li key={practice}>
                                {practice}: {Number(count).toLocaleString('vi-VN')}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <h4>Xin tán thán và tuỳ hỷ công đức thực hành của các đạo hữu 🙏🏻</h4>
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
