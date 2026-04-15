import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Users, Cpu, Play, ClipboardCheck, 
  BarChart3, Building, 
  CheckCircle2, ShieldCheck, AlertTriangle, Hash, X, Info
} from 'lucide-react';

interface KSICItem { code: string; name: string; }
interface DiagnosisItem { title: string; is_target: boolean; reason: string; }
interface DiagnosisResult { items: DiagnosisItem[]; risk_score: number; }

function App() {
  const [businessName, setBusinessName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [ksicResults, setKsicResults] = useState<KSICItem[]>([]);
  const [selectedKSIC, setSelectedKSIC] = useState<KSICItem | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | ''>('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. 실시간 검색 및 자동 코드 바인딩 로직
  useEffect(() => {
    if (categoryName.length >= 1 && !selectedKSIC) {
      const timer = setTimeout(() => {
        axios.get(`http://localhost:8000/ksic/search?query=${categoryName}`)
          .then(res => {
            setKsicResults(res.data);
            setShowDropdown(res.data.length > 0);
            
            // 사용자가 입력한 명칭이 리스트 중 하나와 완전히 일치하면 자동 선택
            const exactMatch = res.data.find((i: KSICItem) => i.name === categoryName);
            if (exactMatch) {
              setSelectedKSIC(exactMatch);
              setShowDropdown(false);
            }
          });
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setShowDropdown(false);
    }
  }, [categoryName, selectedKSIC]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFormValid = businessName.trim() !== '' && selectedKSIC !== null && employeeCount !== '';

  const handleConfirm = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setDiagnosis(null);
    setTimeout(async () => {
      try {
        const res = await axios.post('/diagnosis', {
          business_name: businessName, 
          category_name: selectedKSIC!.name, 
          ksic_code: selectedKSIC!.code, 
          employee_count: Number(employeeCount)
        });
        setDiagnosis(res.data);
      } catch {
        alert('진단 엔진 연결 실패');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex flex-col font-sans">
      <header className="bg-slate-900 text-white py-6 px-8 shadow-2xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/30">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic">KISA 가이드-온</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">스마트 안전진단 플랫폼</p>
            </div>
          </div>
          <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-[10px] font-black text-orange-400 uppercase tracking-widest">
            PHASE 1. 기초 법령 진단
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
          
          <div className="lg:col-span-6 space-y-10">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white">
              <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-8">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="text-blue-600" size={24} />
                  <h2 className="text-xl font-black text-slate-800">사업장 정보 입력</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-300 italic">* 필수 항목</span>
              </div>

              <div className="space-y-8">
                {/* 1. 사업장명 */}
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 ml-1 flex items-center gap-2">
                    사업장 명칭 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="text" 
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
                      placeholder="회사 또는 공장 이름 입력"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. 업종명 및 코드 (7:3 인라인 레이아웃) */}
                <div className="space-y-3 relative" ref={dropdownRef}>
                  <label className="text-sm font-black text-slate-500 ml-1 flex items-center gap-2">
                    KSIC 업종 분류 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <div className="relative flex-[7]">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="text" 
                        className={`w-full pl-14 pr-10 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg ${selectedKSIC ? 'text-blue-600' : ''}`}
                        placeholder="업종명 검색 (예: 식료품)"
                        value={categoryName}
                        onChange={(e) => { setCategoryName(e.target.value); setSelectedKSIC(null); }}
                        onFocus={() => categoryName.length > 0 && setShowDropdown(true)}
                      />
                      {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[999] overflow-hidden border-t-4 border-blue-600 animate-in fade-in slide-in-from-top-2">
                          <ul className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {ksicResults.map(item => (
                              <li 
                                key={item.code} 
                                className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-blue-100 group"
                                onClick={() => { setSelectedKSIC(item); setCategoryName(item.name); setShowDropdown(false); }}
                              >
                                <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500 group-hover:bg-blue-100 transition-colors">{item.code}</span>
                                <span className="text-sm font-bold text-slate-700 truncate">{item.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="relative flex-[3]">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="text" 
                        readOnly
                        className={`w-full pl-14 pr-4 py-5 border-2 rounded-2xl font-black text-lg text-center outline-none transition-all
                          ${selectedKSIC 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-lg shadow-blue-500/10' 
                            : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                        placeholder="CODE"
                        value={selectedKSIC ? selectedKSIC.code : ''}
                      />
                      {selectedKSIC && (
                        <button onClick={() => { setSelectedKSIC(null); setCategoryName(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. 인원수 */}
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 ml-1 flex items-center gap-2">
                    상시근로자 수 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type="number" 
                      className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
                      placeholder="인원수 입력"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">명</span>
                  </div>
                </div>

                {/* 4. 버튼 활성화 */}
                <button 
                  className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl
                    ${isFormValid && !loading 
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99]' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale'}`}
                  onClick={handleConfirm}
                  disabled={!isFormValid || loading}
                >
                  {loading ? <Cpu className="animate-spin" size={24} /> : <><Play fill="currentColor" size={20} /> 법령검토 실행</>}
                </button>
              </div>
            </div>

            {/* RESULTS */}
            {diagnosis && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                {diagnosis.items.map((item, idx) => (
                  <div key={idx} className={`bg-white rounded-[2rem] p-8 shadow-lg border-t-8 transition-transform hover:-translate-y-1 ${item.is_target ? 'border-orange-500' : 'border-green-500'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 rounded-2xl ${item.is_target ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        {item.is_target ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${item.is_target ? 'bg-orange-500 text-white shadow-md' : 'bg-green-500 text-white'}`}>
                        {item.is_target ? 'Target' : 'Pass'}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-4">{item.title}</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">"{item.reason}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white text-center sticky top-32 group">
              <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mb-10 flex items-center justify-center gap-2 opacity-60">
                <BarChart3 size={14} /> Risk Statistics
              </h3>
              <div className="relative inline-block w-full max-w-[260px]">
                <svg viewBox="0 0 100 60" className="w-full drop-shadow-2xl">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" fill="none" 
                    stroke={(diagnosis?.risk_score || 0) > 60 ? '#f43f5e' : '#10b981'} 
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${(diagnosis?.risk_score || 0) * 1.25} 125`}
                    className="transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1)"
                  />
                  <text x="50" y="45" textAnchor="middle" className="text-[20px] font-black fill-slate-900 tracking-tighter">
                    {(diagnosis?.risk_score || 0)}%
                  </text>
                </svg>
                <div className="mt-8 space-y-1">
                  <p className={`text-2xl font-black ${(diagnosis?.risk_score || 0) > 60 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {(diagnosis?.risk_score || 0) > 60 ? '위험 관리 대상' : '안정 상태'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Composite Safety Score</p>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-slate-50 text-left">
                <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] tracking-widest mb-4 uppercase opacity-80">
                  <Info size={14} /> Status Brief
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                  {selectedKSIC 
                    ? <><span className="text-blue-600 font-bold">[{selectedKSIC.code}] {selectedKSIC.name}</span> 업종 정보가 반영되었습니다.</>
                    : "정보를 입력하면 위험 지수가 동적 계산됩니다."
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
