import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Shield, Download, CheckCircle, XCircle, GraduationCap,
  BookOpen, PieChart, Camera, Lock, ArrowRight, RotateCcw, Calendar, Clock, Check, X,
  Filter, BarChart3, ArrowLeftRight, Accessibility, School, StickyNote, MessageSquare, 
  FileText, ZoomIn, ZoomOut, Sparkles, QrCode, TrendingUp, Save, Search, ChevronDown, 
  Menu, CreditCard, ExternalLink, BookOpenCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, 
  query, serverTimestamp, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = typeof __firebase_config !== 
'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-school-database';

// ==========================================
// CONSTANTS & DATA
// ==========================================
const KEMAHIRAN_BM = [
  "KP 1: Huruf Kecil", "KP 2: Huruf Besar", "KP 3: Huruf Vokal", "KP 4: Suku Kata KV",
  "KP 5: Perkataan KV + KV", "KP 6: Perkataan V + KV", "KP 7: Perkataan KV + KV + KV", "KP 8: Perkataan KVK",
  "KP 9: Suku Kata KVK", "KP 10: Perkataan V + KVK", "KP 11: Perkataan KV + KVK", "KP 12: Perkataan KVK + KV",
  "KP 13: Perkataan KVK + KVK", "KP 14: Perkataan KV + KV + KVK", "KP 15: Perkataan KV + KVK + KV", "KP 16: Perkataan KVK + KV + KV",
  "KP 17: Perkataan KV + KVK + KVK", "KP 18: Perkataan KVK + KV + KVK", "KP 19: Perkataan KVK + KVK + KV", "KP 20: Perkataan KVK + KVK + KVK",
  "KP 21: Perkataan KVKK", "KP 22: Perkataan V + KVKK", "KP 23: Perkataan K + VKK", "KP 24: Perkataan KV + KVKK",
  "KP 25: Perkataan KVK + KVKK", "KP 26: Perkataan KVKK + KV", "KP 27: Perkataan KVKK + KVK", "KP 28: Perkataan KVKK + KVKK",
  "KP 29: Perkataan KV + KV + KVKK", "KP 30: Perkataan KV + KVK + KVKK", "KP 31: Perkataan KVK + KV + KVKK", "KP 32: Bacaan dan Pemahaman"
];

const KEMAHIRAN_MATH = [
  "KP 1: Pra Nombor", "KP 2: Konsep Nombor", "KP 3: Nombor Bulat", 
  "KP 4: Tambah Lingkungan 10", "KP 5: Tolak Lingkungan 10",
  "KP 6: Tambah Lingkungan 18", "KP 7: Tolak Lingkungan 18",
  "KP 8: Tambah Lingkungan 100", "KP 9: Tolak Lingkungan 100",
  "KP 10: Darab", "KP 11: Bahagi", "KP 12: Wang & Masa"
];

const subjects = ['Pemulihan BM', 'Pemulihan Matematik', 'Pemulihan BM dan Matematik'];
const cardColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];

// ==========================================
// UI COMPONENTS
// ==========================================
const RetroProgressBar = ({ progress }) => {
  return (
    <div className="w-full bg-slate-700 rounded-md p-1 border border-slate-600 shadow-inner">
      <div className="relative w-full h-6 bg-slate-800 border border-slate-600 rounded-sm overflow-hidden">
        <div className="h-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 relative overflow-hidden transition-all duration-500 ease-out flex items-center" style={{ width: `${progress}%` }}>
          <div className="absolute top-0 left-0 w-full h-full animate-progress-shine opacity-30 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-shadow-sm mix-blend-difference text-white">
          {Math.round(progress)}% Completed
        </div>
      </div>
      <style>{`
        @keyframes progress-shine { 0% { transform: translateX(-100%) skewX(-12deg); } 100% { transform: translateX(200%) skewX(-12deg); } }
        .animate-progress-shine { animation: progress-shine 2s linear infinite; }
      `}</style>
    </div>
  );
};

const ImageAdjuster = ({ imageSrc, onSave, onCancel, title = "Adjust Photo" }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); };
  const handleMouseMove = (e) => { if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = (e) => { setIsDragging(true); setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y }); };
  const handleTouchMove = (e) => { if (isDragging) setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const size = 500;
    canvas.width = size; canvas.height = size;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, size, size);
    const ratio = size / containerRef.current.clientWidth;
    const drawX = (position.x * ratio) + (size / 2) - ((img.width * scale * ratio) / 2);
    const drawY = (position.y * ratio) + (size / 2) - ((img.height * scale * ratio) / 2);
    ctx.drawImage(img, drawX, drawY, img.width * scale * ratio, img.height * scale * ratio);
    onSave(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center"><h3 className="font-bold text-lg text-white">{title}</h3><button onClick={onCancel} className="text-slate-400 hover:text-slate-200"><X size={24} /></button></div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div ref={containerRef} className="w-64 h-64 bg-slate-900 rounded-xl overflow-hidden relative cursor-move touch-none border-2 border-slate-700 shadow-inner" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
            <img ref={imageRef} src={imageSrc} alt="Edit" className="absolute max-w-none origin-center pointer-events-none select-none" style={{ transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`, left: '50%', top: '50%' }} draggable="false" />
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-xl pointer-events-none"></div>
          </div>
          <div className="w-full flex items-center gap-3 text-slate-400"><ZoomOut size={16} /><input type="range" min="0.1" max="3" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" /><ZoomIn size={16} /></div>
        </div>
        <div className="p-4 border-t border-slate-700 flex gap-3"><button onClick={onCancel} className="flex-1 py-2.5 font-bold text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">Cancel</button><button onClick={handleSave} className="flex-1 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md">Save</button></div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

const ImageViewer = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" onClick={onClose}>
       <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={32} /></button>
       <img src={src} alt="Full Screen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

const Avatar = ({ name, color, photoUrl, size = "w-12 h-12", onClick }) => {
  const commonClasses = `${size} rounded-xl shadow-sm border-2 border-slate-800 ring-1 ring-slate-700 flex-shrink-0 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${commonClasses} object-cover object-top bg-slate-800`} onClick={onClick} />;
  const initials = (name || "?").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return <div className={`${commonClasses} flex items-center justify-center text-white font-bold shadow-sm ${color}`}>{initials}</div>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 sticky top-0 z-10"><h3 className="font-bold text-lg text-white tracking-tight">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-200 hover:bg-slate-700 p-1 rounded-full transition-colors"><XCircle size={24} /></button></div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// HELPER LOGIC FUNCTIONS
// ==========================================
const calculateSchoolYearFromIC = (ic) => {
  if (!ic) return null;
  const icStr = String(ic).replace(/\D/g, ''); 
  if (icStr.length < 2) return null;
  const yearPrefix = parseInt(icStr.substring(0, 2));
  if (isNaN(yearPrefix)) return null;
  const birthYear = 2000 + yearPrefix; 
  return new Date().getFullYear() - birthYear - 6;
};

const getYearFromClassString = (className) => {
  if (!className) return null;
  const yearInt = parseInt(String(className).split(' ')[0]);
  return isNaN(yearInt) ? null : yearInt;
};

const getStudentCurrentYear = (student) => {
  const icYear = calculateSchoolYearFromIC(student.ic);
  if (icYear !== null && icYear > 0) return icYear;
  const classYear = getYearFromClassString(student.className);
  if (classYear !== null) return classYear;
  return 0; 
};

const calculateCurrentLulusYear = (className, graduationDate) => {
  const originalYear = getYearFromClassString(className);
  if (originalYear === null) return 99; 
  const gradYear = (graduationDate ? new Date(graduationDate) : new Date()).getFullYear();
  return originalYear + (new Date().getFullYear() - gradYear);
};

const getClassColorStyle = (className) => {
  const safeClassName = String(className || 'Unknown');
  const palettes = [
    { bg: 'bg-blue-900/30', border: 'border-blue-800', text: 'text-blue-100', icon: 'text-blue-400' },
    { bg: 'bg-emerald-900/30', border: 'border-emerald-800', text: 'text-emerald-100', icon: 'text-emerald-400' },
    { bg: 'bg-amber-900/30', border: 'border-amber-800', text: 'text-amber-100', icon: 'text-amber-400' },
    { bg: 'bg-purple-900/30', border: 'border-purple-800', text: 'text-purple-100', icon: 'text-purple-400' },
    { bg: 'bg-rose-900/30', border: 'border-rose-800', text: 'text-rose-100', icon: 'text-rose-400' },
    { bg: 'bg-cyan-900/30', border: 'border-cyan-800', text: 'text-cyan-100', icon: 'text-cyan-400' }
  ];
  let hash = 0;
  for (let i = 0; i < safeClassName.length; i++) hash = safeClassName.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
};

const getSubjectBadgeColor = (subject) => {
  if (subject === 'Pemulihan BM') return 'bg-blue-600';
  if (subject === 'Pemulihan Matematik') return 'bg-orange-500';
  if (subject === 'Pemulihan BM dan Matematik') return 'bg-purple-600';
  return 'bg-slate-500';
};

const calculateStats = (records) => {
  if (!records || records.length === 0) return { percent: 0, present: 0, total: 0 };
  const present = records.filter(r => r.status === 'present').length;
  return { percent: Math.round((present / records.length) * 100), present, total: records.length };
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function StudentDatabaseApp() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [role, setRole] = useState('user'); 
  const [currentSection, setCurrentSection] = useState('profile'); 
  const [selectedAdminStudent, setSelectedAdminStudent] = useState(null); 

  // Force Document Title and HTML Dark Class
  useEffect(() => { 
    document.title = "Pemulihan SJKC Shin Cheng (Harcroft)"; 
    document.documentElement.classList.add('dark');
  }, []);

  // Filters
  const [profileYearFilter, setProfileYearFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [mbkTypeFilter, setMbkTypeFilter] = useState('All');
  const [statsFilters, setStatsFilters] = useState({ year: 'All', gender: 'All', subject: 'All' });
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll State for Progress Tracker
  const progressListContainerRef = useRef(null);
  const progressScrollRef = useRef(0);

  // Auth & Modals
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', program: 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: 'Lelaki', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: ''
  });

  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [uploadType, setUploadType] = useState('profile');

  // Progress State
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);
  const [progressSubject, setProgressSubject] = useState('BM');
  const [studentProgressData, setStudentProgressData] = useState({});

  // Confirmations & Actions
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [moveConfirmation, setMoveConfirmation] = useState({ isOpen: false, student: null, newStatus: '' });
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState(null);
  const [noteForm, setNoteForm] = useState({ id: null, text: '', date: new Date().toISOString().split('T')[0] });

  // --- Effects ---
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(() => {});
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "admin@pemulihan.com") setRole('admin');
      else setRole('user');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setStudents(snapshot.docs.map(doc => ({ id: doc.id, attendanceRecords: [], notes: [], ...doc.data() })));
        setLoading(false);
      }, (error) => { console.error("Firestore error:", error); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleTabChange = (tabId) => {
    setCurrentSection(tabId);
    setSelectedAdminStudent(null);
    if (tabId !== 'progress') {
       setProfileYearFilter('All'); 
       setClassFilter('All'); 
       setSubjectFilter('All');
       setMbkTypeFilter('All');
       setSearchQuery('');
       setSelectedStudentForProgress(null); 
    }
  };

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === 'admin') {
      if (role !== 'admin') setShowAdminLogin(true);
    } else {
      if (role === 'admin') {
         try { await signOut(auth); setRole('user'); } catch(e) { console.error("Logout failed", e); }
      }
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, "admin@pemulihan.com", adminPassword);
        setShowAdminLogin(false); setAdminPassword(''); setLoginError('');
    } catch (error) { setLoginError('Incorrect password.'); }
  };

  const handleImageUpload = (e, type = 'profile') => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("Image is too large. Please choose an image under 5MB."); return; }
      const reader = new FileReader();
      reader.onload = (event) => { setRawImageSrc(event.target.result); setUploadType(type); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropSave = (croppedImageBase64) => {
    if (uploadType === 'profile') setFormData(prev => ({ ...prev, photoUrl: croppedImageBase64 }));
    else setFormData(prev => ({ ...prev, qrCodeUrl: croppedImageBase64 }));
    setRawImageSrc(null);
  };

  const handleCropCancel = () => { setRawImageSrc(null); };

  const handleRemovePhoto = (type = 'profile') => {
    if(window.confirm(`Are you sure you want to remove the ${type === 'profile' ? 'profile photo' : 'QR code'}?`)) {
        if (type === 'profile') setFormData(prev => ({ ...prev, photoUrl: '' }));
        else setFormData(prev => ({ ...prev, qrCodeUrl: '' }));
    }
  };

  const handleClassNameChange = (e) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/^(\d)([A-Z])/, '$1 $2');
    setFormData({ ...formData, className: val });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !db) return;
    if (!formData.gender) { alert("Please select a gender (Jantina) before saving."); return; }
    
    try {
      const dataToSave = {
        name: formData.name, program: formData.program, gender: formData.gender, status: formData.status,
        photoUrl: formData.photoUrl || '', updatedAt: serverTimestamp(), ic: formData.ic || '', isNewStudent: formData.isNewStudent || false
      };
      
      if (formData.program === 'pemulihan') {
        dataToSave.className = formData.className; dataToSave.subject = formData.subject;
        dataToSave.mbkType = ''; dataToSave.remarks = ''; dataToSave.docLink = ''; dataToSave.qrCodeUrl = '';
      } else {
        dataToSave.mbkType = formData.mbkType; dataToSave.remarks = formData.remarks || ''; 
        dataToSave.docLink = formData.docLink || ''; dataToSave.qrCodeUrl = formData.qrCodeUrl || '';
        dataToSave.className = ''; dataToSave.subject = '';
      }

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
          ...dataToSave, attendanceRecords: [], notes: [], color: cardColors[Math.floor(Math.random() * cardColors.length)], createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false); setEditingId(null);
    } catch (err) { console.error("Error saving:", err); }
  };
  
  // Updated toggleSkill to Auto-Save immediately
  const toggleSkill = async (skillIndex) => {
    if (!user || role !== 'admin' || !selectedStudentForProgress || !db) return;

    const currentSubjectKey = progressSubject === 'BM' ? 'bm' : 'math';
    const currentSkills = studentProgressData[currentSubjectKey] || [];
    
    let newSkills;
    if (currentSkills.includes(skillIndex)) {
      newSkills = currentSkills.filter(i => i !== skillIndex);
    } else {
      newSkills = [...currentSkills, skillIndex];
    }
    
    const newProgressData = {
      ...studentProgressData,
      [currentSubjectKey]: newSkills
    };

    // Optimistic UI Update
    setStudentProgressData(newProgressData);

    // Auto Save to Firestore
    try {
       const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForProgress.id);
       await updateDoc(ref, {
         progress: newProgressData
       });
    } catch (err) {
       console.error("Error auto-saving progress:", err);
    }
  };

  const exportToExcel = () => {
    if (!students || students.length === 0) { alert("No data to export."); return; }
    const workbook = XLSX.utils.book_new();
    const formatStudent = (s) => ({
      Name: s.name, Gender: s.gender, IC: s.ic || '', Class: s.className || '', Subject: s.subject || '',
      Program: s.program === 'mbk' ? (s.mbkType || 'MBK') : 'Pemulihan', Status: s.status, Remarks: s.remarks || '', DocLink: s.docLink || ''
    });

    const addSheet = (data, name) => { if(data.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), name); };
    
    addSheet(students.filter(s => (s.program || 'pemulihan') === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) <= 3).map(formatStudent), "Profile (1-3)");
    addSheet(students.filter(s => (s.program || 'pemulihan') === 'pemulihan' && s.status !== 'Lulus' && getStudentCurrentYear(s) >= 4 && getStudentCurrentYear(s) <= 6).map(formatStudent), "PLaN (4-6)");
    addSheet(students.filter(s => s.program === 'mbk').map(formatStudent), "MBK");
    addSheet(students.filter(s => s.status === 'Lulus').map(s => ({ ...formatStudent(s), GraduationDate: s.graduationDate || '' })), "Lulus");
    
    XLSX.writeFile(workbook, "Student_Database.xlsx");
  };

  const executeDelete = async () => {
    if (!user || role !== 'admin' || !deleteConfirmation.studentId || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', deleteConfirmation.studentId));
      setDeleteConfirmation({ isOpen: false, studentId: null, studentName: '' });
    } catch (err) { console.error("Error deleting:", err); }
  };

  const markAttendance = async (status) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    const newRecord = { date: attendanceDate, status: status, timestamp: Date.now() };
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id);
      const existingRecord = selectedStudentForAttendance.attendanceRecords?.find(r => r.date === newRecord.date);
      if (existingRecord) await updateDoc(ref, { attendanceRecords: arrayRemove(existingRecord) });
      await updateDoc(ref, { attendanceRecords: arrayUnion(newRecord) });
      setIsAttendanceModalOpen(false); // Auto close
    } catch (err) { console.error("Error marking attendance:", err); }
  };

  const deleteAttendanceRecord = async (record) => {
    if (!user || !selectedStudentForAttendance || !db) return;
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForAttendance.id), { attendanceRecords: arrayRemove(record) }); } 
    catch (err) { console.error("Error deleting record:", err); }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if (!user || !selectedStudentForNotes || !db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id);
    let newNotes = [...(selectedStudentForNotes.notes || [])];
    if (noteForm.id) newNotes = newNotes.map(n => n.id === noteForm.id ? { ...n, text: noteForm.text, date: noteForm.date } : n);
    else newNotes.push({ id: Date.now().toString(), text: noteForm.text, date: noteForm.date, timestamp: Date.now() });
    try { await updateDoc(ref, { notes: newNotes }); setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] }); } 
    catch (err) { console.error("Error saving note:", err); }
  };

  const deleteNote = async (noteId) => {
    if (!user || !selectedStudentForNotes || !db) return;
    if (!window.confirm('Delete this note?')) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', selectedStudentForNotes.id);
    const newNotes = (selectedStudentForNotes.notes || []).filter(n => n.id !== noteId);
    try { await updateDoc(ref, { notes: newNotes }); } catch (err) { console.error("Error deleting note:", err); }
  };

  const startEditNote = (note) => setNoteForm({ id: note.id, text: note.text, date: note.date });

  const executeMove = async () => {
    if (!user || role !== 'admin' || !moveConfirmation.student || !db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', moveConfirmation.student.id), { 
        status: moveConfirmation.newStatus, graduationDate: moveConfirmation.newStatus === 'Lulus' ? moveDate : null 
      });
      setMoveConfirmation({ isOpen: false, student: null, newStatus: '' });
    } catch (err) { console.error("Error updating status:", err); }
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name, program: student.program || 'pemulihan', className: student.className || '',
      subject: student.subject || 'Pemulihan BM', ic: student.ic || '', gender: student.gender || 'Lelaki',
      mbkType: student.mbkType || 'MBK', status: student.status || 'Active', photoUrl: student.photoUrl || '',
      remarks: student.remarks || '', docLink: student.docLink || '', isNewStudent: student.isNewStudent || false, qrCodeUrl: student.qrCodeUrl || ''
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', program: currentSection === 'mbk' ? 'mbk' : 'pemulihan', className: '', subject: 'Pemulihan BM', ic: '', gender: 'Lelaki', mbkType: 'MBK', status: 'Active', photoUrl: '', remarks: '', docLink: '', isNewStudent: false, qrCodeUrl: '' });
    setIsModalOpen(true);
  };

  const openNotesModal = (student) => {
    setSelectedStudentForNotes(student);
    setNoteForm({ id: null, text: '', date: new Date().toISOString().split('T')[0] });
    setIsNotesModalOpen(true);
  };

  const openAttendanceModal = (student) => {
    setSelectedStudentForAttendance(student);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setIsAttendanceModalOpen(true);
  };

  const handleCheckOKU = (ic) => {
    if (!ic) return;
    const textArea = document.createElement("textarea");
    textArea.value = ic; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
    window.open('https://oku.jkm.gov.my/semakan_oku', '_blank');
  };

  const toggleStudentStatus = (student) => {
    setMoveDate(new Date().toISOString().split('T')[0]);
    setMoveConfirmation({ isOpen: true, student: student, newStatus: student.status === 'Lulus' ? 'Active' : 'Lulus' });
  };


  // --- Filtering & Derived State ---
  const availableYears = useMemo(() => {
    const years = students.filter(s => (s.program || 'pemulihan') === 'pemulihan').map(s => getYearFromClassString(s.className)).filter(y => y !== null);
    return ['All', ...Array.from(new Set(years)).sort((a,b) => a - b)];
  }, [students]);

  const availableClasses = useMemo(() => {
    const classes = students.filter(s => (s.program || 'pemulihan') === 'pemulihan').map(s => s.className).filter(Boolean);
    return ['All', ...Array.from(new Set(classes)).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      const year = getStudentCurrentYear(s);
      const program = s.program || 'pemulihan';
      
      if (currentSection === 'mbk') {
        return program === 'mbk' && year <= 6 && 
               (profileYearFilter === 'All' || profileYearFilter === '' || (s.name || '').toLowerCase().includes(profileYearFilter.toLowerCase())) &&
               (mbkTypeFilter === 'All' || s.mbkType === mbkTypeFilter);
      }
      
      if (currentSection === 'progress') {
         if (program !== 'pemulihan' || s.status === 'Lulus' || year > 3) return false; 
         return (profileYearFilter === 'All' || year === parseInt(profileYearFilter)) &&
                (classFilter === 'All' || s.className === classFilter) &&
                (subjectFilter === 'All' || s.subject === subjectFilter) &&
                (searchQuery === '' || (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
      }

      if (currentSection === 'stats') {
        if (program === 'mbk' || s.status === 'Lulus' || year > 3) return false;
        const filterYear = parseInt(statsFilters.year);
        const matchYear = statsFilters.year === 'All' || (year === filterYear);
        const matchGender = statsFilters.gender === 'All' || (s.gender || 'Lelaki') === statsFilters.gender;
        const matchSubject = statsFilters.subject === 'All' || s.subject === statsFilters.subject;
        return matchYear && matchGender && matchSubject;
      }
      return false;
    });

    if (currentSection === 'progress') {
       result.sort((a, b) => {
         const yA = getStudentCurrentYear(a) || 0;
         const yB = getStudentCurrentYear(b) || 0;
         if (yA !== yB) return yA - yB; 
         return (a.name || '').localeCompare(b.name || '');
       });
    }

    return result;
  }, [students, profileYearFilter, classFilter, subjectFilter, currentSection, statsFilters, searchQuery, mbkTypeFilter]);

  const groupedProfileStudents = useMemo(() => {
    if (currentSection !== 'profile') return {};
    const groups = {};
    students.filter(s => {
      const year = getStudentCurrentYear(s);
      return (s.program || 'pemulihan') === 'pemulihan' && s.status !== 'Lulus' && year <= 3 && 
        (profileYearFilter === 'All' || year === parseInt(profileYearFilter)) &&
        (classFilter === 'All' || s.className === classFilter) &&
        (subjectFilter === 'All' || s.subject === subjectFilter)
    }).forEach(s => { 
        const clsName = s.className || 'No Class';
        if (!groups[clsName]) groups[clsName] = []; 
        groups[clsName].push(s); 
    });
    return groups;
  }, [students, currentSection, profileYearFilter, classFilter, subjectFilter]);

  const groupedPlanStudents = useMemo(() => {
    if (currentSection !== 'plan') return {};
    const groups = {};
    students.filter(s => {
      const year = getStudentCurrentYear(s);
      return (s.program || 'pemulihan') === 'pemulihan' && s.status !== 'Lulus' && year >= 4 && year <= 6;
    }).forEach(s => { 
        const k = `Tahun ${getStudentCurrentYear(s)}`; 
        if (!groups[k]) groups[k] = []; 
        groups[k].push(s); 
    });
    return groups;
  }, [students, currentSection]);

  const groupedLulusStudents = useMemo(() => {
    if (currentSection !== 'lulus') return {};
    const groups = {};
    students.filter(s => s.status === 'Lulus').forEach(s => { 
      const k = `Tahun ${calculateCurrentLulusYear(s.className, s.graduationDate)}`; 
      if (!groups[k]) groups[k] = { students: [] }; 
      groups[k].students.push(s); 
    });
    return groups;
  }, [students, currentSection]);


  // --- Reusable Student Card Renderer ---
  const renderStudentCard = (student, sectionType) => {
    const isMbk = sectionType === 'mbk';
    const isLulus = sectionType === 'lulus';
    const isProfile = sectionType === 'profile';
    const year = getStudentCurrentYear(student);
    const stats = calculateStats(student.attendanceRecords || []);
    const isSelected = selectedAdminStudent === student.id;

    let gradientClass = 'from-blue-400 to-blue-600';
    if (isLulus) {
        gradientClass = 'from-purple-400 to-purple-600';
    } else if (isMbk) {
        gradientClass = 'from-indigo-400 to-indigo-600';
    } else if (isProfile) {
        gradientClass = stats.percent >= 75 ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600';
    }

    const handleCardClick = () => {
      if (role === 'admin') {
        setSelectedAdminStudent(isSelected ? null : student.id);
      }
    };

    return (
      <div 
        key={student.id} 
        onClick={handleCardClick}
        className={`bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500 scale-[1.02]' : 'border-slate-700 hover:-translate-y-1'} group relative overflow-hidden flex flex-col cursor-pointer`}
      >
        {/* Desktop View (Vertical) */}
        <div className={`hidden sm:flex flex-col items-center gap-4 ${isMbk ? 'p-6' : 'p-4'}`}>
          <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size={isMbk ? "w-24 h-24" : "w-16 h-16"} onClick={(e) => { e.stopPropagation(); if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
          
          <div className="w-full text-center">
            <h3 className={`font-bold ${isMbk ? 'text-lg' : 'text-sm'} text-white leading-tight mb-1 break-words`}>{student.name}</h3>
            
            {isMbk ? (
               <>
                 <div className="flex items-center justify-center gap-2 mb-3">
                   <CreditCard size={16} className="text-slate-400" />
                   <span className="font-bold text-slate-300 tracking-wide font-mono">{student.ic}</span>
                 </div>
                 <div className="bg-indigo-900/30 p-2 rounded-lg text-sm font-medium text-indigo-200 mb-2">
                   {year < 1 ? 'Pra' : `Tahun ${year}`}
                 </div>
                 <div className="text-sm text-slate-400 font-medium">
                   {student.gender} • <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.mbkType === 'OKU' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>{student.mbkType || 'MBK'}</span>
                 </div>
               </>
            ) : (
               <>
                 <div className="text-xs font-medium text-slate-400 mb-0.5">{student.className || student.subject}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{student.gender}</p>
                 {!isLulus && <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-2 shadow-sm ${getSubjectBadgeColor(student.subject)} text-white`}>{student.subject}</div>}
                 {isLulus && <div className="text-[10px] text-purple-400 font-semibold bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800 inline-block mt-1">Grad: {student.graduationDate}</div>}
               </>
            )}

            {isProfile && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Attendance</span>
                  <span className={stats.percent >= 75 ? 'text-emerald-400' : 'text-amber-400'}>{stats.percent}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percent}%` }}></div>
                </div>
              </div>
            )}
          </div>
          
          {isMbk && student.remarks && (
            <div className="w-full mt-2 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg flex items-start gap-2 text-left">
              <MessageSquare size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-300 italic">{student.remarks}</p>
            </div>
          )}
          
          {isMbk && (
            <div className="mt-2 w-full pt-4 border-t border-slate-700 flex flex-col gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); window.open(student.docLink, '_blank'); }} 
                disabled={!student.docLink} 
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-xl transition-all shadow-sm ${student.docLink ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 cursor-not-allowed text-slate-500'}`}
              >
                <FileText size={16} /> Docs
              </button>
              {student.mbkType === 'OKU' && student.qrCodeUrl && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setFullScreenImage(student.qrCodeUrl); }} 
                  className="flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm border bg-slate-800 text-white border-slate-600 hover:bg-slate-700"
                >
                  <QrCode size={16} /> Show QR
                </button>
              )}
            </div>
          )}

          {/* Desktop Admin Hover Controls */}
          {role === 'admin' && (
            <div className={`absolute top-2 right-2 flex ${isMbk ? 'flex-row' : 'flex-col'} gap-1 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-slate-800/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-slate-700`}>
               {(!isMbk && !isLulus) && <button onClick={(e) => { e.stopPropagation(); openNotesModal(student); }} className="p-1.5 text-amber-400 hover:bg-slate-700 rounded transition-colors" title="Notes"><StickyNote size={14} /></button>}
               {isProfile && <button onClick={(e) => { e.stopPropagation(); openAttendanceModal(student); }} className="p-1.5 text-blue-400 hover:bg-slate-700 rounded transition-colors" title="Attendance"><Calendar size={14} /></button>}
               <button onClick={(e) => { e.stopPropagation(); openEdit(student); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>
               {!isMbk && <button onClick={(e) => { e.stopPropagation(); toggleStudentStatus(student); }} className="p-1.5 text-purple-400 hover:bg-slate-700 rounded transition-colors" title="Change Status"><RotateCcw size={14} /></button>}
               <button onClick={(e) => { e.stopPropagation(); confirmDelete(student); }} className="p-1.5 text-red-400 hover:bg-slate-700 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {/* Mobile View (Compact Horizontal) */}
        <div className="sm:hidden flex flex-row items-start p-3 gap-3 relative z-10">
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${gradientClass}`}></div>
          
          <div className="flex flex-col items-center gap-2">
            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-16 h-16" onClick={(e) => { e.stopPropagation(); if(student.photoUrl) setFullScreenImage(student.photoUrl); }}/>
            
            {/* Mobile Admin Controls under Avatar (Touch optimized) */}
            {role === 'admin' && isSelected && (
              <div className="grid grid-cols-2 gap-1 w-[70px]">
                 {(!isMbk && !isLulus) && <button onClick={(e) => { e.stopPropagation(); openNotesModal(student); }} className="p-1 text-amber-500 bg-slate-700 border-slate-600 rounded border flex justify-center"><StickyNote size={12} /></button>}
                 {isProfile && <button onClick={(e) => { e.stopPropagation(); openAttendanceModal(student); }} className="p-1 text-blue-500 bg-slate-700 border-slate-600 rounded border flex justify-center"><Calendar size={12} /></button>}
                 <button onClick={(e) => { e.stopPropagation(); openEdit(student); }} className={`p-1 text-slate-400 bg-slate-700 border border-slate-600 flex justify-center rounded ${isMbk || isLulus ? '' : 'col-span-2'}`}><Edit2 size={12} /></button>
                 {!isMbk && <button onClick={(e) => { e.stopPropagation(); toggleStudentStatus(student); }} className="p-1 text-purple-500 bg-slate-700 border-slate-600 rounded border flex justify-center"><RotateCcw size={12} /></button>}
                 <button onClick={(e) => { e.stopPropagation(); confirmDelete(student); }} className="p-1 text-red-500 bg-slate-700 border-slate-600 rounded border flex justify-center col-span-2"><Trash2 size={12} /></button>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-bold text-sm text-white leading-tight mb-1 break-words">{student.name}</h3>
            <div className="text-xs font-medium text-slate-400 mb-0.5">{isMbk ? (year < 1 ? 'Pra' : `Tahun ${year}`) : student.className}</div>
            
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
               {student.gender || 'Lelaki'}
               {isMbk && <span className={`px-1.5 py-0.5 rounded border text-[9px] ${student.mbkType === 'OKU' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-amber-900/30 text-amber-400 border-amber-800'}`}>{student.mbkType || 'MBK'}</span>}
            </div>
            
            {!isMbk && !isLulus && <div className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-md mb-1 shadow-sm ${getSubjectBadgeColor(student.subject)}`}>{student.subject}</div>}

            {isProfile && (
              <div className="flex flex-col gap-1 w-full mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Attendance</span>
                  <span className={stats.percent >= 75 ? 'text-emerald-400' : 'text-amber-400'}>{stats.percent}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${stats.percent >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stats.percent}%` }}></div>
                </div>
              </div>
            )}

            {isMbk && student.remarks && <div className="text-[10px] text-slate-400 italic bg-yellow-900/20 px-2 py-1 rounded border border-yellow-800/50 flex items-start gap-1 mt-1"><MessageSquare size={10} className="mt-0.5 flex-shrink-0 text-yellow-500" /><span className="line-clamp-2">{student.remarks}</span></div>}
            
            {isMbk && (
              <div className="mt-2 flex flex-col gap-1">
                 <button onClick={(e) => { e.stopPropagation(); window.open(student.docLink, '_blank'); }} disabled={!student.docLink} className={`flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border ${student.docLink ? 'bg-indigo-900/30 text-indigo-400 border-indigo-800' : 'bg-slate-800 border-slate-700 cursor-not-allowed text-slate-500'}`}><FileText size={12} /> {student.docLink ? 'Docs' : 'No Docs'}</button>
                 {student.mbkType === 'OKU' && student.qrCodeUrl && (
                   <button onClick={(e) => { e.stopPropagation(); setFullScreenImage(student.qrCodeUrl); }} className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 px-2 rounded border bg-emerald-900/30 text-emerald-400 border-emerald-800"><QrCode size={12} /> QR Code</button>
                 )}
              </div>
            )}

            {isLulus && <div className="text-[10px] text-purple-400 font-semibold bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800 inline-block mt-1">Grad: {student.graduationDate}</div>}
          </div>
        </div>

        {student.isNewStudent && <div className="absolute top-2 left-3 sm:top-2 sm:right-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse z-20 flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-white rounded-full"></span> NEW</div>}
      </div>
    );
  };

  // --- Main App Render Return ---
  return (
    <div className="min-h-screen font-sans selection:bg-indigo-900 bg-slate-900 text-slate-200">
      
      {/* Top Navbar */}
      <nav className="backdrop-blur-md border-b sticky top-0 z-30 bg-slate-900/90 border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md"><GraduationCap className="text-white h-6 w-6" /></div>
              <span className="font-bold text-lg tracking-tight hidden sm:block text-white">
                Pengurusan Program Pemulihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 font-mono tracking-widest uppercase drop-shadow-md">DIGITAL</span>
              </span>
              <span className="font-bold text-lg tracking-tight sm:hidden text-white">
                Pemulihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 font-mono tracking-widest uppercase drop-shadow-md">DIGITAL</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="rounded-full p-1 flex items-center text-xs font-bold shadow-inner bg-slate-800">
                <button 
                  onClick={() => handleRoleSwitch('admin')} 
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${role === 'admin' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {role === 'admin' && <Shield size={12} className="text-indigo-400" />}
                  Admin
                </button>
                <button 
                  onClick={() => handleRoleSwitch('user')} 
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 ${role === 'user' ? 'bg-slate-700 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  User
                </button>
              </div>
            </div>

          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Desktop Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:justify-center">
            <div className="flex p-1.5 rounded-2xl shadow-sm border gap-1 min-w-max bg-slate-800 border-slate-700">
              {[
                { id: 'profile', label: 'Profile Pemulihan' }, 
                { id: 'plan', label: 'PLaN' }, 
                { id: 'mbk', label: 'Murid MBK & OKU' }, 
                { id: 'lulus', label: 'Lulus' }, 
                { id: 'stats', label: 'Statistik' }, 
                { id: 'progress', label: 'Progress' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => handleTabChange(tab.id)} 
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${currentSection === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        {currentSection === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 rounded-2xl border shadow-sm bg-slate-800 border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Filter size={20} className="text-indigo-500" /> Filter Database
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Year</label>
                  <select 
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium bg-slate-700 border-slate-600 text-white"
                    value={statsFilters.year}
                    onChange={(e) => setStatsFilters(p => ({...p, year: e.target.value}))}
                  >
                    <option value="All">Semua Tahun</option>
                    {availableYears.filter(y => y !== 'All').map(y => <option key={y} value={y}>{`Tahun ${y}`}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Gender</label>
                  <select 
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium bg-slate-700 border-slate-600 text-white"
                    value={statsFilters.gender}
                    onChange={(e) => setStatsFilters(p => ({...p, gender: e.target.value}))}
                  >
                    <option value="All">Semua Jantina</option>
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Subject</label>
                  <select 
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none font-medium bg-slate-700 border-slate-600 text-white"
                    value={statsFilters.subject}
                    onChange={(e) => setStatsFilters(p => ({...p, subject: e.target.value}))}
                  >
                    <option value="All">Semua Subjek</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-9 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl border flex items-center justify-between shadow-sm bg-orange-900/20 border-orange-800/50">
              <div>
                 <p className="text-sm font-bold uppercase tracking-wider text-orange-400">Students Found (Pemulihan Only)</p>
                 <h2 className="text-5xl font-extrabold mt-1 tracking-tight text-orange-300">{filteredStudents.length}</h2>
              </div>
              <div className="p-4 rounded-2xl bg-orange-900/50">
                <PieChart className="text-orange-500 w-12 h-12" />
              </div>
            </div>

            {filteredStudents.length > 0 && (
              <div className="rounded-2xl border shadow-sm overflow-hidden bg-slate-800 border-slate-700">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b bg-slate-800 border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-300">Name</th>
                        <th className="px-6 py-4 font-bold text-slate-300">Gender</th>
                        <th className="px-6 py-4 font-bold text-slate-300">Class</th>
                        <th className="px-6 py-4 font-bold text-slate-300">Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{student.name}</td>
                          <td className="px-6 py-4 text-slate-400">{student.gender || 'Lelaki'}</td>
                          <td className="px-6 py-4">
                            <span className="rounded px-2 py-1 font-mono text-xs bg-slate-700 text-slate-300">
                              {student.className}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{student.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PROGRESS SECTION --- */}
        {currentSection === 'progress' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
             
             {/* LIST VIEW (Hidden when student selected) */}
             <div className={`bg-slate-800 rounded-3xl border border-slate-700 shadow-sm p-6 md:p-8 flex-col h-[calc(100vh-12rem)] min-h-[500px] ${selectedStudentForProgress ? 'hidden' : 'flex'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                     <div className="bg-indigo-900/50 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                       <TrendingUp className="text-indigo-400 w-6 h-6" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-extrabold text-white tracking-tight">Student Progress Tracker</h2>
                       <p className="text-sm text-slate-400">Select a student to view or update mastery of skills (Kemahiran).</p>
                     </div>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="relative group">
                      <select 
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none bg-slate-700 border-slate-600 text-white cursor-pointer" 
                        value={profileYearFilter} 
                        onChange={(e) => setProfileYearFilter(e.target.value)}
                      >
                        <option value="All">All Years</option>
                        {availableYears.map(y => y !== 'All' && <option key={y} value={y}>Tahun {y}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-300" />
                    </div>
                    <div className="relative group">
                      <select 
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none bg-slate-700 border-slate-600 text-white cursor-pointer" 
                        value={classFilter} 
                        onChange={(e) => setClassFilter(e.target.value)}
                      >
                        <option value="All">All Classes</option>
                        {availableClasses.map(c => c !== 'All' && <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-300" />
                    </div>
                    <div className="relative group">
                      <select 
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm appearance-none bg-slate-700 border-slate-600 text-white cursor-pointer" 
                        value={subjectFilter} 
                        onChange={(e) => setSubjectFilter(e.target.value)}
                      >
                        <option value="All">Semua Subjek</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none group-hover:text-slate-300" />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Search student name..." 
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                </div>

                <div 
                  ref={progressListContainerRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-3"
                >
                   {filteredStudents.map(student => {
                       const bmProgress = Math.round(((student.progress?.bm?.length || 0) / 32) * 100);
                       const mathProgress = Math.round(((student.progress?.math?.length || 0) / 12) * 100);
                       const takesBM = student.subject === 'Pemulihan BM' || student.subject === 'Pemulihan BM dan Matematik';
                       const takesMath = student.subject === 'Pemulihan Matematik' || student.subject === 'Pemulihan BM dan Matematik';

                       return (
                       <button 
                         key={student.id}
                         onClick={() => {
                            if (progressListContainerRef.current) {
                                progressScrollRef.current = progressListContainerRef.current.scrollTop;
                            }
                            setSelectedStudentForProgress(student);
                            setStudentProgressData(student.progress || { bm: [], math: [] });
                            if ((student.subject || '').includes('Matematik') && !(student.subject || '').includes('BM')) {
                              setProgressSubject('MATH');
                            } else {
                              setProgressSubject('BM');
                            }
                         }}
                         className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-2xl transition-all text-left group bg-slate-800 border-slate-700 hover:border-indigo-500 hover:shadow-md"
                       >
                          <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                            <Avatar name={student.name} color={student.color} photoUrl={student.photoUrl} size="w-12 h-12" />
                            <div className="min-w-0">
                               <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 truncate transition-colors">{student.name}</h4>
                               <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                 <span className="font-semibold bg-slate-700 px-2 py-0.5 rounded text-slate-300">{student.className}</span>
                                 <span>{student.gender}</span>
                               </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-3 sm:mt-0">
                             {takesBM && (
                               <div className="w-full sm:w-32 flex flex-col gap-1.5">
                                 <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                   <span>BM</span>
                                   <span className="text-indigo-400">{bmProgress}%</span>
                                 </div>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                   <div className="h-full rounded-full bg-indigo-500 transition-all" style={{width: `${bmProgress}%`}}></div>
                                 </div>
                               </div>
                             )}
                             {takesMath && (
                               <div className="w-full sm:w-32 flex flex-col gap-1.5">
                                 <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                   <span>MATH</span>
                                   <span className="text-emerald-400">{mathProgress}%</span>
                                 </div>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                   <div className="h-full rounded-full bg-emerald-500 transition-all" style={{width: `${mathProgress}%`}}></div>
                                 </div>
                               </div>
                             )}
                             <ArrowRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors hidden sm:block flex-shrink-0 ml-2" />
                          </div>
                       </button>
                     )})}
                   {filteredStudents.length === 0 && <p className="text-slate-400 text-sm py-8 text-center bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">No students found matching your search.</p>}
                </div>
             </div>

             {/* DETAIL VIEW (Shown when student selected) */}
             {selectedStudentForProgress && (
               <div className="rounded-3xl border shadow-sm overflow-hidden bg-slate-800 border-slate-700">
                 
                 <div className="border-b p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 border-slate-700">
                    <div className="flex items-center gap-4">
                      <Avatar name={selectedStudentForProgress.name} color={selectedStudentForProgress.color} photoUrl={selectedStudentForProgress.photoUrl} size="w-20 h-20" />
                      <div>
                        <h3 className="font-bold text-xl text-white">{selectedStudentForProgress.name}</h3>
                        <p className="text-sm mb-1 text-slate-400">{selectedStudentForProgress.className}</p>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm ${getSubjectBadgeColor(selectedStudentForProgress.subject)}`}>
                          {selectedStudentForProgress.subject}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedStudentForProgress(null);
                        setTimeout(() => {
                           if (progressListContainerRef.current) {
                             progressListContainerRef.current.scrollTop = progressScrollRef.current;
                           }
                        }, 0);
                      }} 
                      className="px-4 py-2 border rounded-xl text-sm font-bold shadow-sm bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      Back to List
                    </button>
                 </div>
                 
                 <div className="flex border-b border-slate-700">
                    {(selectedStudentForProgress.subject === 'Pemulihan BM' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (
                      <button 
                        onClick={() => setProgressSubject('BM')} 
                        className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${progressSubject === 'BM' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        Bahasa Melayu
                      </button>
                    )}
                    {(selectedStudentForProgress.subject === 'Pemulihan Matematik' || selectedStudentForProgress.subject === 'Pemulihan BM dan Matematik') && (
                      <button 
                        onClick={() => setProgressSubject('MATH')} 
                        className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${progressSubject === 'MATH' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      >
                        Matematik
                      </button>
                    )}
                 </div>

                 <div className="p-6 md:p-8">
                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="font-bold text-lg text-white">Overall Progress</h4>
                        <span className="text-sm font-bold text-slate-400">
                          {studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0} / {progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length}
                        </span>
                      </div>
                      <RetroProgressBar 
                          progress={
                            ((studentProgressData[progressSubject === 'BM' ? 'bm' : 'math']?.length || 0) / 
                            (progressSubject === 'BM' ? KEMAHIRAN_BM.length : KEMAHIRAN_MATH.length)) * 100
                          } 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                       {(progressSubject === 'BM' ? KEMAHIRAN_BM : KEMAHIRAN_MATH).map((skill, index) => {
                          const skillIndex = index + 1;
                          const subjectKey = progressSubject === 'BM' ? 'bm' : 'math';
                          const isCompleted = studentProgressData[subjectKey]?.includes(skillIndex);
                          
                          return (
                            <div 
                              key={index} 
                              onClick={() => toggleSkill(skillIndex)}
                              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-900/30 border-indigo-800' : 'bg-emerald-900/30 border-emerald-800') : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                            >
                               <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isCompleted ? (progressSubject === 'BM' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : 'bg-slate-700 border-slate-600'}`}>
                                  {isCompleted && <Check size={16} strokeWidth={3} />}
                               </div>
                               <span className={`text-sm font-medium ${isCompleted ? 'text-white' : 'text-slate-400'}`}>{skill}</span>
                            </div>
                          );
                       })}
                    </div>
                 </div>
               </div>
             )}
           </div>
        )}

        {/* --- GRID VIEWS (Profile, PLaN, MBK, Lulus) --- */}
        {(['profile', 'plan', 'mbk', 'lulus'].includes(currentSection)) && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Header & Controls */}
             <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-start lg:items-center p-4 rounded-2xl shadow-sm border bg-slate-800 border-slate-700">
                
                {/* Profile Filters */}
                {currentSection === 'profile' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group">
                      <select 
                        className="w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white" 
                        value={profileYearFilter} 
                        onChange={(e) => setProfileYearFilter(e.target.value)}
                      >
                        <option value="All">Filter: All Years</option>
                        {availableYears.filter(y=>y!=='All').map(y => <option key={y} value={y}>{`Tahun ${y}`}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                    <div className="relative group">
                      <select 
                        className="w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white" 
                        value={classFilter} 
                        onChange={(e) => setClassFilter(e.target.value)}
                      >
                        <option value="All">Filter: All Classes</option>
                        {availableClasses.filter(c=>c!=='All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                    <div className="relative group">
                      <select 
                        className="w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white" 
                        value={subjectFilter} 
                        onChange={(e) => setSubjectFilter(e.target.value)}
                      >
                        <option value="All">Semua Subjek</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                )}
                
                {/* Headers */}
                {currentSection === 'plan' && <h2 className="text-2xl font-extrabold tracking-tight ml-4 text-blue-400">PLaN (Thn 4-6)</h2>}
                {currentSection === 'lulus' && <h2 className="text-2xl font-extrabold tracking-tight ml-4 text-purple-400">Graduates (Lulus)</h2>}
                
                {/* MBK Specific Filter & Header */}
                {currentSection === 'mbk' && (
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
                    <h2 className="text-2xl font-extrabold tracking-tight ml-2 text-indigo-400">MBK & OKU</h2>
                    <div className="relative group w-full sm:w-auto">
                      <select 
                        className="w-full sm:w-48 px-4 py-2.5 border rounded-xl font-bold text-sm appearance-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white"
                        value={mbkTypeFilter} 
                        onChange={(e) => setMbkTypeFilter(e.target.value)}
                      >
                        <option value="All">Semua Kategori</option>
                        <option value="MBK">MBK Sahaja</option>
                        <option value="OKU">OKU Sahaja</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Top Action Buttons */}
                <div className="flex gap-3 w-full lg:w-auto items-center ml-auto">
                   {(role === 'admin' && (currentSection === 'profile' || currentSection === 'mbk')) && (
                     <button 
                       onClick={openAdd} 
                       className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md font-bold text-sm"
                     >
                       <Plus size={18} strokeWidth={2.5}/> Add Student
                     </button>
                   )}
                   <button 
                     onClick={exportToExcel} 
                     className="flex-1 lg:flex-none flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 border rounded-xl bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                   >
                     <Download size={18} /> Export Excel
                   </button>
                </div>
             </div>

             {/* Dynamic Grids */}
             {loading ? (
               <div className="text-center py-24">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div>
                 <p className="text-slate-400">Loading database...</p>
               </div>
             ) : (currentSection === 'profile' && Object.keys(groupedProfileStudents).length === 0) || (currentSection === 'plan' && Object.keys(groupedPlanStudents).length === 0) || (currentSection === 'mbk' && filteredStudents.length === 0) || (currentSection === 'lulus' && Object.keys(groupedLulusStudents).length === 0) ? (
               <div className="text-center py-24 rounded-3xl border border-dashed shadow-sm bg-slate-800 border-slate-700">
                 <Users className="text-slate-400 w-10 h-10 mx-auto mb-4"/>
                 <h3 className="text-xl font-bold text-white">No students found</h3>
               </div>
             ) : (
               <div className="space-y-10">
                  {/* Profile Groups */}
                  {currentSection === 'profile' && Object.keys(groupedProfileStudents).sort().map(className => {
                    const style = getClassColorStyle(className);
                    return (
                      <div key={className} className="rounded-3xl border shadow-sm overflow-hidden bg-slate-800 border-slate-700">
                        <div className={`px-8 py-4 border-b ${style.border} flex justify-between items-center bg-slate-800`}>
                          <h3 className={`font-extrabold ${style.text} text-lg flex items-center gap-3`}>
                            <School className={style.icon} size={20}/> {className}
                          </h3>
                          <span className={`text-xs font-bold bg-slate-900 border-slate-700 ${style.icon} px-3 py-1.5 border rounded-lg shadow-sm`}>
                            {groupedProfileStudents[className].length} Students
                          </span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {groupedProfileStudents[className].map(s => renderStudentCard(s, 'profile'))}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* PLaN Groups */}
                  {currentSection === 'plan' && Object.keys(groupedPlanStudents).sort().map(yearGrp => (
                    <div key={yearGrp} className="rounded-3xl border shadow-sm overflow-hidden bg-slate-800 border-slate-700">
                      <div className="px-8 py-4 border-b flex justify-between items-center bg-blue-900/30 border-blue-800">
                        <h3 className="font-extrabold text-lg flex items-center gap-2 text-blue-400">
                          <BookOpenCheck className="text-blue-500" size={20}/>{yearGrp}
                        </h3>
                        <span className="text-xs font-bold px-3 py-1.5 border rounded-lg shadow-sm bg-slate-900 border-blue-800 text-blue-400">
                          {groupedPlanStudents[yearGrp].length} Students
                        </span>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedPlanStudents[yearGrp].map(s => renderStudentCard(s, 'plan'))}
                      </div>
                    </div>
                  ))}

                  {/* MBK Flat List */}
                  {currentSection === 'mbk' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredStudents.map(s => renderStudentCard(s, 'mbk'))}
                    </div>
                  )}

                  {/* Lulus Groups */}
                  {currentSection === 'lulus' && Object.keys(groupedLulusStudents).sort().map(yearGrp => (
                    <div key={yearGrp} className="rounded-3xl border shadow-sm overflow-hidden bg-slate-800 border-slate-700">
                      <div className="px-8 py-4 border-b flex justify-between items-center bg-purple-900/30 border-purple-800">
                        <h3 className="font-extrabold text-lg flex items-center gap-2 text-purple-400">
                          <Calendar className="text-purple-500" size={20}/>{yearGrp}
                        </h3>
                        <span className="text-xs font-bold px-3 py-1.5 border rounded-lg shadow-sm bg-slate-900 border-purple-800 text-purple-400">
                          {groupedLulusStudents[yearGrp].students.length} Students
                        </span>
                      </div>
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedLulusStudents[yearGrp].students.map(s => renderStudentCard(s, 'lulus'))}
                      </div>
                    </div>
                  ))}
               </div>
             )}
           </div>
        )}

        {/* --- GLOBAL MODALS (Image/Camera) --- */}
        {rawImageSrc && (
          <ImageAdjuster 
            imageSrc={rawImageSrc} 
            onSave={handleCropSave} 
            onCancel={handleCropCancel} 
          />
        )}
        
        {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage} 
            onClose={() => setFullScreenImage(null)} 
          />
        )}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <div className="fixed bottom-0 left-0 w-full backdrop-blur-md border-t flex justify-around items-center z-50 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe bg-slate-900/90 border-slate-800">
         {[
           { id: 'profile', l: 'Profile', i: School }, 
           { id: 'plan', l: 'PLaN', i: BookOpenCheck }, 
           { id: 'mbk', l: 'MBK', i: Accessibility }, 
           { id: 'lulus', l: 'Lulus', i: GraduationCap }, 
           { id: 'stats', l: 'Stats', i: BarChart3 }, 
           { id: 'progress', l: 'Prog', i: TrendingUp }
         ].map(t => (
            <button 
              key={t.id} 
              onClick={() => handleTabChange(t.id)} 
              className={`flex flex-col items-center justify-center w-full py-3 transition-colors ${currentSection === t.id ? 'text-indigo-400 bg-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <t.i size={20} strokeWidth={currentSection===t.id ? 2.5 : 2}/>
              <span className="text-[10px] font-bold mt-1">{t.l}</span>
            </button>
         ))}
      </div>
      
      {/* --- FUNCTIONAL MODALS --- */}
      
      {/* Admin Login */}
      <Modal isOpen={showAdminLogin} onClose={()=>{setShowAdminLogin(false); setLoginError('');}} title="Admin Login">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-3 rounded-full mb-3 bg-indigo-900/30">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-sm text-center text-slate-400">Enter admin password.</p>
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Password" 
            autoFocus 
            className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white" 
            value={adminPassword} 
            onChange={e=>{setAdminPassword(e.target.value); setLoginError('');}}
          />
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Login</button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={deleteConfirmation.isOpen} onClose={()=>setDeleteConfirmation({isOpen:false})} title="Confirm Deletion">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="p-4 rounded-full mb-4 bg-red-900/30">
            <Trash2 className="w-10 h-10 text-red-400" />
          </div>
          <h4 className="text-lg font-bold mb-2 text-white">Delete Record?</h4>
          <p className="text-slate-400">
            Are you sure you want to delete <span className="font-semibold text-white">{deleteConfirmation.studentName}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>setDeleteConfirmation({isOpen:false})} className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors bg-slate-700 text-white hover:bg-slate-600">Cancel</button>
          <button onClick={executeDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm transition-colors">Yes, Delete</button>
        </div>
      </Modal>

      {/* Move Status Confirmation */}
      <Modal isOpen={moveConfirmation.isOpen} onClose={()=>setMoveConfirmation({isOpen:false})} title="Change Status">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="p-4 rounded-full mb-4 bg-blue-900/30">
            <ArrowLeftRight className="w-10 h-10 text-blue-400" />
          </div>
          <h4 className="text-lg font-bold mb-2 text-white">Move Student?</h4>
          <p className="mb-4 text-slate-400">
            {moveConfirmation.newStatus === 'Lulus' ? `Mark ${moveConfirmation.student?.name} as "Lulus Pemulihan"?` : `Move ${moveConfirmation.student?.name} back to "Profile Murid Pemulihan"?`}
          </p>
          {moveConfirmation.newStatus === 'Lulus' && (
            <div className="w-full text-left p-3 rounded-lg border bg-slate-700 border-slate-600">
              <label className="block text-xs font-semibold uppercase mb-1 text-slate-400">Graduation Date</label>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input 
                  type="date" 
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full p-0 style-color-scheme-dark text-white" 
                  value={moveDate} 
                  onChange={(e) => setMoveDate(e.target.value)} 
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={()=>setMoveConfirmation({isOpen:false})} className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors bg-slate-700 text-white hover:bg-slate-600">Cancel</button>
          <button onClick={executeMove} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">Confirm</button>
        </div>
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={()=>setIsNotesModalOpen(false)} title="Catatan Murid">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-900/20 border border-amber-800/50">
            <Avatar name={selectedStudentForNotes?.name||''} color={selectedStudentForNotes?.color||'bg-blue-500'} photoUrl={selectedStudentForNotes?.photoUrl}/>
            <div>
              <h4 className="font-bold text-white">{selectedStudentForNotes?.name}</h4>
              <p className="text-sm text-slate-400">{selectedStudentForNotes?.className}</p>
            </div>
          </div>
          
          <form onSubmit={saveNote} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-slate-400">Date</label>
              <input 
                type="date" 
                required 
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 style-color-scheme-dark bg-slate-700 border-slate-600 text-white" 
                value={noteForm.date} 
                onChange={e=>setNoteForm(p=>({...p, date:e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-slate-400">Catatan (Note)</label>
              <textarea 
                required 
                rows="3" 
                placeholder="Enter note details here..." 
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                value={noteForm.text} 
                onChange={e=>setNoteForm(p=>({...p, text:e.target.value}))}
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm transition-colors">{noteForm.id?'Update':'Add'} Note</button>
          </form>

          <div className="border-t pt-4 border-slate-700">
            <h5 className="text-sm font-bold mb-3 flex items-center gap-2 text-white"><Clock size={16} /> History</h5>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {selectedStudentForNotes?.notes && selectedStudentForNotes.notes.length > 0 ? (
                [...selectedStudentForNotes.notes].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((n)=>(
                <div key={n.id} className="p-3 border rounded-xl text-sm group relative transition-colors bg-slate-800 border-slate-700">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border bg-slate-700 text-slate-300 border-slate-600">{n.date}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg shadow-sm bg-slate-900/90">
                      <button type="button" onClick={()=>startEditNote(n)} className="p-1 hover:bg-slate-800 rounded text-blue-400"><Edit2 size={14} /></button>
                      <button type="button" onClick={()=>deleteNote(n.id)} className="p-1 hover:bg-slate-800 rounded text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-slate-300">{n.text}</p>
                </div>
              ))) : (<p className="text-center text-sm py-4 text-slate-500">No notes recorded yet.</p>)}
            </div>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={()=>setIsAttendanceModalOpen(false)} title="Manage Attendance">
         <div className="space-y-6">
           <div className="flex items-center gap-4 p-4 rounded-xl border border-transparent bg-slate-800 border-slate-700">
             <Avatar name={selectedStudentForAttendance?.name||''} color={selectedStudentForAttendance?.color||'bg-blue-500'} photoUrl={selectedStudentForAttendance?.photoUrl}/>
             <div>
               <h4 className="font-bold text-white">{selectedStudentForAttendance?.name}</h4>
               <p className="text-sm text-slate-400">{selectedStudentForAttendance?.className}</p>
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium mb-2 text-slate-300">Mark for specific date</label>
             <div className="flex gap-2">
               <input 
                 type="date" 
                 className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 style-color-scheme-dark bg-slate-700 border-slate-600 text-white" 
                 value={attendanceDate} 
                 onChange={e=>setAttendanceDate(e.target.value)}
               />
               <button 
                 onClick={()=>markAttendance('present')} 
                 className="flex items-center justify-center gap-1 px-4 py-2 font-bold rounded-xl transition-colors bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50"
               >
                 <Check size={16}/> Present
               </button>
               <button 
                 onClick={()=>markAttendance('absent')} 
                 className="flex items-center justify-center gap-1 px-4 py-2 font-bold rounded-xl transition-colors bg-red-900/50 text-red-400 hover:bg-red-800/50"
               >
                 <X size={16}/> Absent
               </button>
             </div>
           </div>

           <div>
             <h5 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white"><Clock size={14}/> Record History</h5>
             <div className="max-h-48 overflow-y-auto border rounded-xl divide-y border-slate-700 divide-slate-700">
                {selectedStudentForAttendance?.attendanceRecords?.length > 0 ? (
                  [...selectedStudentForAttendance.attendanceRecords].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((r,i)=>(
                  <div key={i} className="py-3 px-4 flex justify-between items-center transition-colors hover:bg-slate-800">
                    <span className="font-medium text-sm text-slate-300">{r.date}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${r.status==='present' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>{r.status}</span>
                      <button onClick={()=>deleteAttendanceRecord(r)} className="p-1 rounded transition-colors text-slate-500 hover:text-red-400 hover:bg-slate-700"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))) : (<div className="p-4 text-center text-sm text-slate-500">No records found.</div>)}
             </div>
           </div>
         </div>
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} title={editingId ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {!editingId && (
            <div className="flex p-1 rounded-xl mb-4 bg-slate-900">
              <button 
                type="button" 
                onClick={()=>setFormData(p=>({...p,program:'pemulihan'}))} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.program==='pemulihan'?'bg-slate-700 shadow-sm text-indigo-400':'text-slate-400 hover:text-slate-200'}`}
              >
                Profile Pemulihan
              </button>
              <button 
                type="button" 
                onClick={()=>setFormData(p=>({...p,program:'mbk'}))} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.program==='mbk'?'bg-slate-700 shadow-sm text-indigo-400':'text-slate-400 hover:text-slate-200'}`}
              >
                Murid MBK & OKU
              </button>
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-colors bg-slate-800/50 border-slate-600 hover:border-indigo-500">
            <div className="mb-3">
              <Avatar name={formData.name||'Student'} photoUrl={formData.photoUrl} size="w-20 h-20"/>
            </div>
            <label className="cursor-pointer">
              <span className="flex items-center gap-2 text-sm font-bold transition-colors text-indigo-400 hover:text-indigo-300">
                <Camera size={16}/> {formData.photoUrl?'Change Photo':'Upload Photo'}
              </span>
              <input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'profile')}/>
            </label>
            {formData.photoUrl && (
              <div className="flex items-center gap-3 mt-2">
                <button type="button" onClick={()=>{setRawImageSrc(formData.photoUrl);setUploadType('profile');}} className="text-xs font-bold hover:underline text-indigo-400">Adjust</button>
                <span className="text-slate-600">|</span>
                <button type="button" onClick={()=>handleRemovePhoto('profile')} className="text-xs font-bold hover:underline text-red-400">Remove</button>
              </div>
            )}
            <p className="text-xs mt-2 text-slate-500">Max size 5MB</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-slate-300">Full Name</label>
            <input 
              required 
              placeholder="e.g. Jane Doe" 
              className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
              value={formData.name} 
              onChange={e=>setFormData({...formData,name:e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-300">Jantina (Gender)</label>
            <div className="flex gap-6 p-2.5 border rounded-xl bg-slate-800/50 border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={formData.gender==='Lelaki'} onChange={()=>setFormData({...formData,gender:'Lelaki'})}/> 
                <span className="text-sm text-white">Lelaki</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" checked={formData.gender==='Perempuan'} onChange={()=>setFormData({...formData,gender:'Perempuan'})}/> 
                <span className="text-sm text-white">Perempuan</span>
              </label>
            </div>
          </div>

          {formData.program === 'pemulihan' ? (
            <>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">IC Number (Optional but Recommended)</label>
                <input 
                  placeholder="For Auto-Year (e.g. 16...)" 
                  className="w-full p-2.5 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                  value={formData.ic} 
                  onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} 
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">Class Name</label>
                <input 
                  required 
                  placeholder="e.g. 2 Hebat" 
                  className="w-full p-2.5 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                  value={formData.className} 
                  onChange={handleClassNameChange}
                />
                <p className="text-xs mt-1 text-slate-500">Format: Year ClassName (e.g. 2 Hebat)</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">Subject</label>
                <select 
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white" 
                  value={formData.subject} 
                  onChange={e=>setFormData({...formData,subject:e.target.value})}
                >
                  {subjects.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 font-bold p-3 border rounded-xl cursor-pointer bg-slate-800/50 border-slate-700 text-slate-300">
                <input 
                  type="checkbox" 
                  checked={formData.isNewStudent} 
                  onChange={e=>setFormData({...formData,isNewStudent:e.target.checked})} 
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-gray-300"
                /> 
                Murid Baru (插班生)
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">Kategori (Category)</label>
                <div className="flex gap-6 p-2.5 border rounded-xl bg-slate-800/50 border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" className="text-amber-600 focus:ring-amber-500 w-4 h-4" checked={formData.mbkType==='MBK'} onChange={()=>setFormData({...formData,mbkType:'MBK'})}/> 
                    <span className="text-sm text-white">MBK (Tiada Kad)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" checked={formData.mbkType==='OKU'} onChange={()=>setFormData({...formData,mbkType:'OKU'})}/> 
                    <span className="text-sm text-white">OKU (Ada Kad)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">MyKid / IC Number</label>
                <input 
                  required 
                  placeholder="e.g. 160520101234" 
                  className="w-full p-2.5 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                  value={formData.ic} 
                  onChange={e=>setFormData({...formData,ic:e.target.value.replace(/\D/g,'')})} 
                  maxLength={12}
                />
                <p className="text-xs mt-1 text-slate-500">System will auto-calculate School Year based on first 2 digits.</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">Remarks</label>
                <textarea 
                  placeholder="Enter optional remarks..." 
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                  rows="2" 
                  value={formData.remarks} 
                  onChange={e=>setFormData({...formData,remarks:e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-300">Document Link</label>
                <input 
                  placeholder="https://..." 
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-700 border-slate-600 text-white placeholder-slate-400" 
                  value={formData.docLink} 
                  onChange={e=>setFormData({...formData,docLink:e.target.value})}
                />
              </div>
              
              {formData.mbkType === 'OKU' && (
                <div className="p-4 border rounded-xl flex items-center justify-between bg-slate-800 border-slate-700">
                  <span className="font-bold flex items-center gap-2 text-sm text-slate-300">
                    <QrCode size={16}/> Kad OKU QR
                  </span>
                  <div className="flex items-center gap-3">
                    {formData.qrCodeUrl && (
                      <button type="button" onClick={()=>handleRemovePhoto('qr')} className="text-red-500 text-xs font-bold hover:underline">
                        Remove
                      </button>
                    )}
                    <label className="px-4 py-2 rounded-lg cursor-pointer font-bold text-xs transition-colors bg-indigo-900/50 text-indigo-400 hover:bg-indigo-800">
                      Upload
                      <input type="file" hidden accept="image/*" onChange={e=>handleImageUpload(e,'qr')}/>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={()=>setIsModalOpen(false)} 
              className="flex-1 py-3 text-sm font-bold rounded-xl transition-colors bg-slate-700 text-white hover:bg-slate-600"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 text-sm text-white font-bold rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              {editingId ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}