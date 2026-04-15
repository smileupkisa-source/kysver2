import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Users, Cpu, ClipboardCheck, 
  BarChart3, Building, 
  CheckCircle2, ShieldCheck, AlertTriangle, Plus, Trash2, FileText
} from 'lucide-react';

interface KSICItem { code: string; name: string; }
interface DiagnosisItem { title: string; is_target: boolean; reason: string; }
interface SubstanceClass { substance: string; class: string; }
interface AnalysisResult { 
  items: DiagnosisItem[]; 
  psm_r_value: number; 
  substance_classes: SubstanceClass[];
  risk_score: number; 
}

function App() {
  const [businessName, setBusinessName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [ksicResults, setKsicResults] = useState<KSICItem[]>([]);
  const [selectedKSIC, setSelectedKSIC] = useState<KSICItem | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | ''>('');
  const [substances, setSubstances] = useState([{ name_or_cas: '', quantity: '' }]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 실시간 검색 및 자동 코드 바인딩
  useEffect(() => {
    if (categoryName.length >= 1 && !selectedKSIC) {
      const timer = setTimeout(() => {
        axios.get(`/ksic/search?query=${categoryName}`)
          .then(res => {
            setKsicResults(res.data);
            setShowDropdown(res.data.length > 0);
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

  const addSubstance = () => setSubstances([...substances, { name_or_cas: '', quantity: '' }]);
  const removeSubstance = (idx: number) => setSubstances(substances.filter((_, i) => i !== idx));
  const updateSubstance = (idx: number, field: string, value: string) => {
    const next = [...substances];
    (next[idx] as any)[field] = value;
    setSubstances(next);
  };

  const isFormValid = businessName.trim() !== '' && selectedKSIC !== null && employeeCount !== '';

  const handleAnalyze = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setResult(null);
    
    try {
      const res = await axios.post('/analyze', {
        business_name: businessName, 
        ksic_code: selectedKSIC!.code, 
        employee_count: Number(employeeCount),
        substances: substances.filter(s => s.name_or_cas !== '').map(s => ({
          name_or_cas: s.name_or_cas,
          quantity: Number(s.quantity) || 0
        }))
      });
      // 세련된 애니메이션을 위해 최소 로딩 시간 부여
      setTimeout(() => {
        setResult(res.data);
        setLoading(false);
      }, 3500);
    } catch {
      alert('분석 서버 연결 실패');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex flex-col font-sans">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-20px) translateX(-10px); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translateY(20px) translateX(10px); }
          80% { opacity: 1; }
          100% { transform: translateY(-20px) translateX(-10px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s infinite ease-in-out;
        }
      `}</style>

      <header className="bg-slate-900 text-white py-6 px-8 shadow-2xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/30">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter">산업안전보건 관계법령정보 분석 도구</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Smart Regulatory Analysis System</p>
            </div>
          </div>
          <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 text-[10px] font-black text-blue-400 uppercase tracking-widest">
            V2.0 고도화 버전
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
                  <h2 className="text-xl font-black text-slate-800">사업장 및 물질 정보 입력</h2>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. 사업장명 & 인원 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1">사업장 명칭</label>
                    <div className="relative">
                      <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="text" 
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                        placeholder="회사명 입력"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1">상시근로자 수</label>
                    <div className="relative">
                      <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="number" 
                        className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                        placeholder="인원수"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">명</span>
                    </div>
                  </div>
                </div>

                {/* 2. 업종 분류 */}
                <div className="space-y-3 relative" ref={dropdownRef}>
                  <label className="text-sm font-black text-slate-500 ml-1">업종 분류 (KSIC)</label>
                  <div className="flex gap-4">
                    <div className="relative flex-[7]">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="text" 
                        className="w-full pl-14 pr-10 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold"
                        placeholder="업종명 검색 (예: 화학제품)"
                        value={categoryName}
                        onChange={(e) => { setCategoryName(e.target.value); setSelectedKSIC(null); }}
                        onFocus={() => categoryName.length > 0 && setShowDropdown(true)}
                      />
                      {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[999] overflow-hidden border-t-4 border-blue-600">
                          <ul className="max-h-60 overflow-y-auto p-2">
                            {ksicResults.map(item => (
                              <li key={item.code} className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"
                                onClick={() => { setSelectedKSIC(item); setCategoryName(item.name); setShowDropdown(false); }}>
                                <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500">{item.code}</span>
                                <span className="text-sm font-bold text-slate-700">{item.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="relative flex-[3]">
                      <input type="text" readOnly className="w-full py-5 border-2 rounded-2xl font-black text-center outline-none bg-slate-50 border-slate-100 text-blue-600"
                        placeholder="CODE" value={selectedKSIC ? selectedKSIC.code : ''} />
                    </div>
                  </div>
                </div>

                {/* 3. 물질 정보 입력 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-black text-slate-500">취급 유해화학물질 정보 (선택)</label>
                    <button onClick={addSubstance} className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-all">
                      <Plus size={14} /> 물질 추가
                    </button>
                  </div>
                  <div className="space-y-3">
                    {substances.map((sub, idx) => (
                      <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                        <input 
                          type="text" 
                          className="flex-[6] px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                          placeholder="물질명 또는 CAS NO (예: 7782-50-5)"
                          value={sub.name_or_cas}
                          onChange={(e) => updateSubstance(idx, 'name_or_cas', e.target.value)}
                        />
                        <div className="flex-[3] relative">
                          <input 
                            type="number" 
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                            placeholder="취급량"
                            value={sub.quantity}
                            onChange={(e) => updateSubstance(idx, 'quantity', e.target.value)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">kg</span>
                        </div>
                        {substances.length > 1 && (
                          <button onClick={() => removeSubstance(idx)} className="p-4 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl
                    ${isFormValid && !loading 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  onClick={handleAnalyze}
                  disabled={!isFormValid || loading}
                >
                  {loading ? <Cpu className="animate-spin" size={24} /> : "정밀 분석 실행"}
                </button>
              </div>
            </div>

            {/* RESULTS */}
            {result && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                {result.items.map((item, idx) => (
                  <div key={idx} className={`bg-white rounded-[2rem] p-8 shadow-lg border-t-8 ${item.is_target ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 rounded-2xl ${item.is_target ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {item.is_target ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${item.is_target ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        {item.is_target ? 'REQUIRED' : 'PASS'}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-4">{item.title}</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">"{item.reason}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* 분석 애니메이션 섹션 */}
            {loading && (
              <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-white flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
                <div className="relative">
                  <FileText size={120} className="text-slate-100" strokeWidth={1} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Search size={64} className="text-blue-600 animate-scan" strokeWidth={3} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">법령 및 규제 분석 중...</h3>
                  <p className="text-sm text-slate-400 font-bold animate-pulse">데이터베이스 대조 및 R값 계산을 진행하고 있습니다.</p>
                </div>
              </div>
            )}

            {!loading && (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-white text-center sticky top-32">
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mb-10 flex items-center justify-center gap-2">
                  <BarChart3 size={14} /> Analysis Summary
                </h3>
                
                {/* PSM R-Value Gauge */}
                <div className="relative inline-block w-full max-w-[260px] mb-12">
                  <svg viewBox="0 0 100 60" className="w-full drop-shadow-2xl">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" fill="none" 
                      stroke={(result?.psm_r_value || 0) >= 1 ? '#f43f5e' : '#3b82f6'} 
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${Math.min((result?.psm_r_value || 0) * 125, 125)} 125`}
                      className="transition-all duration-1000"
                    />
                    <text x="50" y="45" textAnchor="middle" className="text-[18px] font-black fill-slate-900">
                      R={result?.psm_r_value || '0.00'}
                    </text>
                  </svg>
                  <p className="mt-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">PSM 규정량 대비 취급 비율</p>
                </div>

                {/* 별표 1 물질 분류 결과 */}
                {result?.substance_classes && result.substance_classes.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-50 text-left">
                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] tracking-widest mb-4 uppercase">
                      <AlertTriangle size={14} /> 위험 물질 분류 (별표 1)
                    </div>
                    <div className="space-y-3">
                      {result.substance_classes.map((c, i) => (
                        <div key={i} className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-[11px] font-black text-red-700">[{c.substance}]</p>
                          <p className="text-xs font-bold text-red-500">{c.class}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
