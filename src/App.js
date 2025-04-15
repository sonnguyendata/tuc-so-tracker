import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyUuBW2WUpTWnhaG1y8JaqNbCLJaMgc-JI7Yuupt8ZRMzUVQ1gEbP-2ckYmo1l6zDZLFQ/exec';

function App() {
  const [mode, setMode] = useState(''); // '', 'new', 'existing'
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [dharmaName, setDharmaName] = useState('');
  const [practice, setPractice] = useState('');
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch danh sách pháp tu từ Google Sheets
  useEffect(() => {
    fetch(SHEET_API_URL)
      .then((res) => res.json())
      .then((data) => setPracticeOptions(data))
      .catch((err) => console.error('Không thể lấy danh sách pháp tu', err));
  }, []);

  // Tự động load thông tin từ localStorage khi nhập ID
  useEffect(() => {
    if (id && mode === 'existing') {
      const profile = JSON.parse(localStorage.getItem(id));
      if (profile) {
        setName(profile.name);
        setDharmaName(profile.dharmaName);
        setPractice(profile.practice);
      }
    }
  }, [id, mode]);

  const handleSaveProfile = () => {
    if (!id || !name || !dharmaName || !practice) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    localStorage.setItem(id, JSON.stringify({ name, dharmaName, practice }));
    alert('Đã lưu thông tin. Bạn có thể nhập túc số.');
  };

  const handleSubmit = async () => {
    if (!id || todayCount <= 0) {
      alert('Vui lòng nhập ID và số túc hợp lệ.');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const payload = {
      id,
      name,
      dharmaName,
      practice,
      date: dateStr,
      count: todayCount,
    };

    try {
      await fetch(SHEET_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setTotal((prev) => prev + todayCount);
      setTodayCount(0);
      alert('Đã ghi nhận túc số thành công!');
    } catch (err) {
      console.error('Lỗi gửi dữ liệu:', err);
      alert('Không thể gửi dữ liệu. Vui lòng thử lại.');
    }
  };

  if (!mode) {
    return (
      <div style={styles.container}>
        <h2>Chào mừng đến với Túc Số Tracker</h2>
        <button onClick={() => setMode('new')}>🔰 Tôi là người mới</button>
        <button onClick={() => setMode('existing')}>🔑 Tôi đã có ID</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Túc Số Tracker – Kim Cang Thừa</h2>

      <label><strong>Mã ID:</strong></label>
      <input value={id} onChange={(e) => setId(e.target.value)} />
      <br />

      {mode === 'new' && (
        <>
          <label>Tên:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <br />

          <label>Pháp Danh:</label>
          <input value={dharmaName} onChange={(e) => setDharmaName(e.target.value)} />
          <br />

          <label>Pháp Tu:</label>
          <select value={practice} onChange={(e) => setPractice(e.target.value)}>
            <option value="">-- Chọn Pháp Tu --</option>
            {practiceOptions.map((item, idx) => (
              <option key={idx} value={item}>{item}</option>
            ))}
          </select>
          <br />

          <button onClick={handleSaveProfile}>💾 Lưu Thông Tin</button>
        </>
      )}

      <hr />

      <label>Chọn Ngày:</label>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        dateFormat="yyyy-MM-dd"
      />
      <br />

      <label>Số Túc Hôm Nay:</label>
      <input
        type="number"
        min={0}
        value={todayCount}
        onChange={(e) => setTodayCount(Number(e.target.value))}
      />
      <br />

      <button onClick={handleSubmit}>➕ Cộng vào Tổng</button>

      <h3>Tổng Túc Số trong phiên: {total}</h3>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 500,
    margin: '0 auto',
    padding: 20,
    fontFamily: 'sans-serif',
  },
};

export default App;
