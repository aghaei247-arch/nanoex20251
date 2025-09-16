import React, { useState, useEffect } from "react";

// Nano Exhibition Manager
// Single-file React component (default export) — Tailwind-ready
// Features:
// - CRUD for Exhibitors, Booths, Events (schedule), Attendees
// - LocalStorage persistence
// - Search & filters
// - CSV export for lists
// - Simple printable roster / badges

const STORAGE_KEY = "nano_exhibition_manager_v1";

const sampleData = {
  exhibitors: [
    { id: "ex-1", name: "NanoTech Lab", contact: "info@nanotech.example", booth: "A1", notes: "Graphene demos" },
    { id: "ex-2", name: "Micro Instruments", contact: "sales@micro.example", booth: "B2", notes: "AFM & SEM" },
  ],
  booths: [
    { id: "b-A1", code: "A1", size: "3x3", notes: "Near entrance" },
    { id: "b-B2", code: "B2", size: "3x2", notes: "Corner" },
  ],
  events: [
    { id: "ev-1", title: "Opening Ceremony", start: "2025-11-12T10:00", end: "2025-11-12T10:30", location: "Main Hall", speaker: "Dr. A" },
  ],
  attendees: [
    { id: "at-1", name: "Ali Reza", company: "NanoTech Lab", type: "Visitor", email: "ali@example.com" },
  ],
};

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleData;
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return sampleData;
  }
}

function exportCSV(array, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = array
    .map((row) =>
      columns
        .map((c) => {
          const v = row[c.key] ?? "";
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  const csv = header + "\n" + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [data, setData] = useState(loadFromStorage);
  const [tab, setTab] = useState("dashboard");

  // Forms state
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  // Generic CRUD helpers
  function addItem(collection, item) {
    setData((d) => ({ ...d, [collection]: [...d[collection], item] }));
  }
  function updateItem(collection, id, patch) {
    setData((d) => ({
      ...d,
      [collection]: d[collection].map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }
  function removeItem(collection, id) {
    setData((d) => ({ ...d, [collection]: d[collection].filter((it) => it.id !== id) }));
  }

  // Simple filtered views
  const filteredExhibitors = data.exhibitors.filter((e) =>
    [e.name, e.contact, e.booth, e.notes].join(" ").toLowerCase().includes(q.toLowerCase())
  );
  const filteredBooths = data.booths.filter((b) => [b.code, b.size, b.notes].join(" ").toLowerCase().includes(q.toLowerCase()));
  const filteredEvents = data.events.filter((ev) => [ev.title, ev.location, ev.speaker].join(" ").toLowerCase().includes(q.toLowerCase()));
  const filteredAttendees = data.attendees.filter((a) => [a.name, a.company, a.email, a.type].join(" ").toLowerCase().includes(q.toLowerCase()));

  // Small subcomponents
  function Topbar() {
    return (
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Nano Exhibition Manager</h1>
          <span className="text-sm text-muted-foreground">(local demo)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={tab} onChange={(e) => setTab(e.target.value)} className="border rounded px-2 py-1">
            <option value="dashboard">Dashboard</option>
            <option value="exhibitors">Exhibitors</option>
            <option value="booths">Booths</option>
            <option value="events">Schedule</option>
            <option value="attendees">Attendees</option>
            <option value="export">Export</option>
            <option value="settings">Settings</option>
          </select>
        </div>
      </div>
    );
  }

  function DashboardView() {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Overview</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Exhibitors: {data.exhibitors.length}</li>
            <li>Booths: {data.booths.length}</li>
            <li>Schedule items: {data.events.length}</li>
            <li>Attendees: {data.attendees.length}</li>
          </ul>
        </div>
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="mt-3 flex flex-col gap-2">
            <button className="btn" onClick={() => setTab("exhibitors")}>Manage Exhibitors</button>
            <button className="btn" onClick={() => setTab("attendees")}>Manage Attendees</button>
            <button className="btn" onClick={() => setTab("events")}>Edit Schedule</button>
          </div>
        </div>
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Latest Registrations</h3>
          <div className="mt-2">
            {data.attendees.slice(-5).reverse().map((a) => (
              <div key={a.id} className="p-2 border-b last:border-b-0">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.company} • {a.type}</div>
              </div>
            ))}
            {data.attendees.length === 0 && <div className="text-sm text-muted-foreground">No registrations yet.</div>}
          </div>
        </div>
      </div>
    );
  }

  function ExhibitorsView() {
    const [form, setForm] = useState({ name: "", contact: "", booth: "", notes: "" });

    function submit(e) {
      e.preventDefault();
      const item = { id: uid("ex"), ...form };
      addItem("exhibitors", item);
      setForm({ name: "", contact: "", booth: "", notes: "" });
    }

    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 card p-4 border rounded">
          <h3 className="font-semibold">Add exhibitor</h3>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
            <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Contact" value={form.contact} onChange={(e)=>setForm({...form,contact:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Booth" value={form.booth} onChange={(e)=>setForm({...form,booth:e.target.value})} className="border px-2 py-1 rounded" />
            <textarea placeholder="Notes" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} className="border px-2 py-1 rounded" />
            <div className="flex gap-2">
              <button className="btn px-3 py-1" type="submit">Add</button>
              <button type="button" className="btn px-3 py-1" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(filteredExhibitors)); alert('Copied filtered JSON')}}>Copy JSON</button>
            </div>
          </form>
        </div>
        <div className="md:col-span-2 card p-4 border rounded">
          <h3 className="font-semibold">Exhibitors</h3>
          <div className="mt-3 space-y-2">
            {filteredExhibitors.map((ex) => (
              <div key={ex.id} className="p-3 border rounded flex items-start justify-between">
                <div>
                  <div className="font-medium">{ex.name} <span className="text-sm text-muted-foreground">{ex.booth}</span></div>
                  <div className="text-sm">{ex.contact}</div>
                  <div className="text-xs text-muted-foreground">{ex.notes}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={()=>{setSelected({collection:'exhibitors',item:ex});}}>Edit</button>
                  <button className="btn" onClick={()=>{if(confirm('Delete exhibitor?')) removeItem('exhibitors',ex.id);}}>Delete</button>
                </div>
              </div>
            ))}
            {filteredExhibitors.length===0 && <div className="text-sm text-muted-foreground">No exhibitors match.</div>}
          </div>
        </div>
      </div>
    );
  }

  function BoothsView(){
    const [form,setForm]=useState({code:'',size:'',notes:''});
    function submit(e){e.preventDefault(); addItem('booths',{id:uid('b'),...form}); setForm({code:'',size:'',notes:''});}
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Add booth</h3>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
            <input required placeholder="Code (e.g. A1)" value={form.code} onChange={(e)=>setForm({...form,code:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Size" value={form.size} onChange={(e)=>setForm({...form,size:e.target.value})} className="border px-2 py-1 rounded" />
            <textarea placeholder="Notes" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} className="border px-2 py-1 rounded" />
            <div className="flex gap-2"><button className="btn" type="submit">Add</button></div>
          </form>
        </div>
        <div className="md:col-span-2 card p-4 border rounded">
          <h3 className="font-semibold">Booths</h3>
          <div className="mt-3 grid gap-2">
            {filteredBooths.map(b=> (
              <div key={b.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.code} <span className="text-sm text-muted-foreground">{b.size}</span></div>
                  <div className="text-xs text-muted-foreground">{b.notes}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={()=>setSelected({collection:'booths',item:b})}>Edit</button>
                  <button className="btn" onClick={()=>{if(confirm('Delete booth?')) removeItem('booths',b.id);}}>Delete</button>
                </div>
              </div>
            ))}
            {filteredBooths.length===0 && <div className="text-sm text-muted-foreground">No booths match.</div>}
          </div>
        </div>
      </div>
    );
  }

  function EventsView(){
    const [form,setForm]=useState({title:'',start:'',end:'',location:'',speaker:''});
    function submit(e){e.preventDefault(); addItem('events',{id:uid('ev'),...form}); setForm({title:'',start:'',end:'',location:'',speaker:''});}
    return (
      <div className="p-4">
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Add schedule item</h3>
          <form onSubmit={submit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <input required placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="border px-2 py-1 rounded" />
            <input type="datetime-local" placeholder="Start" value={form.start} onChange={(e)=>setForm({...form,start:e.target.value})} className="border px-2 py-1 rounded" />
            <input type="datetime-local" placeholder="End" value={form.end} onChange={(e)=>setForm({...form,end:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Location" value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Speaker" value={form.speaker} onChange={(e)=>setForm({...form,speaker:e.target.value})} className="border px-2 py-1 rounded" />
            <div className="col-span-full flex gap-2"><button className="btn" type="submit">Add</button></div>
          </form>
        </div>
        <div className="mt-4 grid gap-2">
          <h3 className="font-semibold">Schedule</h3>
          {filteredEvents.map(ev=> (
            <div key={ev.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{ev.title} <span className="text-sm text-muted-foreground">{ev.location}</span></div>
                <div className="text-xs">{ev.start} → {ev.end} • {ev.speaker}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={()=>setSelected({collection:'events',item:ev})}>Edit</button>
                <button className="btn" onClick={()=>{if(confirm('Delete event?')) removeItem('events',ev.id);}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function AttendeesView(){
    const [form,setForm]=useState({name:'',company:'',email:'',type:'Visitor'});
    function submit(e){e.preventDefault(); addItem('attendees',{id:uid('at'),...form}); setForm({name:'',company:'',email:'',type:'Visitor'});}    
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border rounded">
          <h3 className="font-semibold">Register attendee</h3>
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
            <input required placeholder="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="border px-2 py-1 rounded" />
            <input placeholder="Company" value={form.company} onChange={(e)=>setForm({...form,company:e.target.value})} className="border px-2 py-1 rounded" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="border px-2 py-1 rounded" />
            <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="border px-2 py-1 rounded">
              <option>Visitor</option>
              <option>Exhibitor</option>
              <option>Speaker</option>
              <option>Staff</option>
            </select>
            <div className="flex gap-2"><button className="btn" type="submit">Register</button></div>
          </form>
        </div>
        <div className="md:col-span-2 card p-4 border rounded">
          <h3 className="font-semibold">Attendees</h3>
          <div className="mt-3 grid gap-2">
            {filteredAttendees.map(a=> (
              <div key={a.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name} <span className="text-sm text-muted-foreground">{a.type}</span></div>
                  <div className="text-sm">{a.company} • {a.email}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={()=>setSelected({collection:'attendees',item:a})}>Edit</button>
                  <button className="btn" onClick={()=>{if(confirm('Delete attendee?')) removeItem('attendees',a.id);}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function ExportView(){
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold">Export data</h3>
        <div className="flex gap-2">
          <button className="btn" onClick={()=>exportCSV(data.exhibitors,[{key:'name',label:'Name'},{key:'contact',label:'Contact'},{key:'booth',label:'Booth'},{key:'notes',label:'Notes'}])}>Export Exhibitors CSV</button>
          <button className="btn" onClick={()=>exportCSV(data.attendees,[{key:'name',label:'Name'},{key:'company',label:'Company'},{key:'email',label:'Email'},{key:'type',label:'Type'}])}>Export Attendees CSV</button>
          <button className="btn" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(data)); alert('Full data copied to clipboard')}}>Copy Full JSON</button>
        </div>
      </div>
    );
  }

  function SettingsView(){
    return (
      <div className="p-4">
        <h3 className="font-semibold">Settings</h3>
        <div className="mt-3 space-y-2">
          <button className="btn" onClick={()=>{if(confirm('Reset demo data? This will overwrite your current data.')){ localStorage.removeItem(STORAGE_KEY); setData(sampleData);}}}>Reset to sample data</button>
          <button className="btn" onClick={()=>{ const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); el.download = 'nano_exhibition_data.json'; el.click();}}>Download JSON Backup</button>
        </div>
      </div>
    );
  }

  function EditModal(){
    if(!selected) return null;
    const {collection,item} = selected;
    const [form,setForm] = useState({...item});
    function save(){ updateItem(collection,item.id,form); setSelected(null); }
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
        <div className="bg-white p-4 rounded w-full max-w-2xl">
          <h3 className="font-semibold">Edit {collection}</h3>
          <div className="mt-3 grid gap-2">
            {Object.keys(form).filter(k=>k!=='id').map(k=> (
              <div key={k}>
                <label className="block text-xs font-medium">{k}</label>
                <input value={form[k] ?? ''} onChange={(e)=>setForm({...form,[k]:e.target.value})} className="border px-2 py-1 rounded w-full" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 justify-end">
            <button className="btn" onClick={()=>setSelected(null)}>Cancel</button>
            <button className="btn" onClick={save}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto shadow-sm bg-white">
        <Topbar />
        <div>
          {tab === 'dashboard' && <DashboardView />}
          {tab === 'exhibitors' && <ExhibitorsView />}
          {tab === 'booths' && <BoothsView />}
          {tab === 'events' && <EventsView />}
          {tab === 'attendees' && <AttendeesView />}
          {tab === 'export' && <ExportView />}
          {tab === 'settings' && <SettingsView />}
        </div>
      </div>
      {selected && <EditModal />}
      <footer className="max-w-7xl mx-auto p-4 text-sm text-center text-muted-foreground">Nano Exhibition Manager — Local demo</footer>
    </div>
  );
}
