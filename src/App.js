import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = 'https://script.google.com/macros/s/AKfycbwzWNuKLVrIAtzoYSKlOOz1HL1BrY069qAVutulNCWuUbJmqKsZKmstysHx2_h_fweSXA/exec';

function App() {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [dharmaName, setDharmaName] = useState('');
  const [practice, setPractice] = useState('');
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([{ practice:'', count:'' }]);
  const [totals, setTotals] = useState({});
  const [streak, setStreak] = useState(0);
  const [dailyData, setDailyData] = useState({});
  const [loading, setLoading] = useState(false);

  // Load Pháp Tu và Profile khi nhập ID
  useEffect(() => {
    fetch(API_URL).then(r=>r.json()).then(setPracticeOptions);
  }, []);

  useEffect(() => {
    if (!id) return;
    // lấy profile
    fetch(`${API_URL}?action=profile&id=${encodeURIComponent(id)}`)
      .then(r=>r.json())
      .then(p=>{
        if (p) {
          setName(p.name);
          setDharmaName(p.dharmaName);
          setPractice(p.practice);
        } else {
          setName(''); setDharmaName(''); setPractice('');
          setTotals({}); setDailyData({}); setStreak(0);
        }
      });
    // lấy summary luôn, dù profile mới hay có sẵn
    fetch(`${API_URL}?action=summary&id=${encodeURIComponent(id)}`)
      .then(r=>r.json())
      .then(({ summary, daily, streak }) => {
        setTotals(summary);
        setDailyData(daily);
        setStreak(streak);
      });
  }, [id]);

  const saveProfile = async () => {
    if (!id||!name||!dharmaName||!practice) {
      return alert('Nhập đủ ID, Tên, Pháp danh, Pháp tu');
    }
    const params = new URLSearchParams({
      action: 'saveProfile',
      id, name, dharmaName, practice
    });
    const res = await fetch(API_URL, {
      method: 'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: params.toString()
    });
    const text = await res.text();
    if (text==='ProfileSaved') alert('Đã lưu profile');
  };

  // handlers
  const handleChangeEntry = (i, field, v) => {
    const u=[...entries];
    u[i][field] = v;
    setEntries(u);
  };
  const addEntry    = ()=>setEntries([...entries,{practice:'',count:''}]);
  const removeEntry = i=>{
    if(entries.length>1){
      const u=[...entries]; u.splice(i,1); setEntries(u);
    }
  };
  const decrementCount = i=>{
    const u=[...entries];
    const v=parseInt(u[i].count,10)||0;
    u[i].count = v>0? v-1 : 0;
    setEntries(u);
  };
  const incrementCount = i=>{
    const u=[...entries];
    const v=parseInt(u[i].count,10)||0;
    u[i].count = v+1;
    setEntries(u);
  };

  const handleSubmit = async () => {
    if (!id) return alert('Nhập ID trước');
    // lọc entries
    const valid = entries
      .map(e=>({...e, countNum: parseInt(e.count,10)||0}))
      .filter(e=>e.practice && e.countNum>0);
    if (!valid.length) return alert('Nhập ít nhất 1 dòng hợp lệ');

    setLoading(true);
    const dateStr = format(selectedDate,'yyyy-MM-dd');

    for(const e of valid){
      const params = new URLSearchParams({
        id, name, dharmaName,
        practice: e.practice,
        date: dateStr,
        count: e.countNum.toString()
      });
      await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: params.toString()
      });
    }

    alert('Ghi thành công!');
    // refresh summary
    const resp = await fetch(`${API_URL}?action=summary&id=${encodeURIComponent(id)}`);
    const { summary, daily, streak } = await resp.json();
    setTotals(summary);
    setDailyData(daily);
    setStreak(streak);
    setEntries([{practice:'',count:''}]);
    setLoading(false);
  };

  const sortedDates = Object.keys(dailyData).sort();
  return (
    <div style={{maxWidth:600,margin:'auto',padding:20,fontFamily:'sans-serif'}}>
      <h2>🧘 Túc Số Tracker</h2>

      <label>ID:</label>
      <input value={id} onChange={e=>setId(e.target.value)} /><br/>
      <label>Tên:</label>
      <input value={name} onChange={e=>setName(e.target.value)} /><br/>
      <label>Pháp Danh:</label>
      <input value={dharmaName} onChange={e=>setDharmaName(e.target.value)} /><br/>
      <label>Pháp Tu:</label>
      <select value={practice} onChange={e=>setPractice(e.target.value)}>
        <option value="">-- Chọn pháp tu --</option>
        {practiceOptions.map((p,i)=><option key={i} value={p}>{p}</option>)}
      </select>
      <button onClick={saveProfile}>💾 Lưu profile</button>

      <hr/>

      <label>Chọn ngày:</label>
      <DatePicker selected={selectedDate} onChange={d=>setSelectedDate(d)} dateFormat="yyyy-MM-dd" />
      <h3>📋 Nhập Túc Số</h3>

      {entries.map((entry,index)=>(
        <div key={index} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <select
            value={entry.practice}
            onChange={e=>handleChangeEntry(index,'practice',e.target.value)}
          >
            <option value="">--Pháp Tu--</option>
            {practiceOptions.map((p,i)=>
              <option key={i} value={p}>{p}</option>
            )}
          </select>

          <button onClick={()=>decrementCount(index)} style={{width:30}}>–</button>
          <input
            type="text"
            value={entry.count}
            readOnly
            placeholder="Nhập số"
            style={{width:50,textAlign:'center'}}
          />
          <button onClick={()=>incrementCount(index)} style={{width:30}}>+</button>
          <button onClick={()=>removeEntry(index)} style={{color:'red'}}>❌</button>
        </div>
      ))}
      <button onClick={addEntry}>➕ Thêm dòng</button>

      <hr/>
      <button onClick={handleSubmit}>✅ Gửi Dữ Liệu</button>
      {loading && <p>⏳ Đang xử lý...</p>}

      {Object.keys(totals).length>0 && (
        <>
          <h4>📊 Tổng Túc Số Tính Đến Hôm Nay</h4>
          {streak>0 && <p>🎉 Bạn đã {streak} ngày liên tục!</p>}
          <ul>
            {Object.entries(totals).map(([k,v])=>
              <li key={k}>{k}: {v.toLocaleString('vi-VN')}</li>
            )}
          </ul>
          <div>
            <h5>📈 Biểu đồ (chưa tích hợp code chart)</h5>
            {/* Nếu muốn chart, cài thêm chart.js và render chartData */}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
