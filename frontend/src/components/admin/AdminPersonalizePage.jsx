import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, Wand2, FileText, Bell } from 'lucide-react';

import QuestionsInbox from './QuestionsInbox';
import RecommendationDetail from './RecommendationDetail';
import TemplatesManager from './TemplatesManager';
import FollowupsPanel from './FollowupsPanel';

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.16, ease: 'easeIn' } },
};

// mini card shell so every panel looks consistent
const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/10 bg-[#111827]/70 backdrop-blur-sm shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ${className}`}>
    {children}
  </div>
);

const TabButton = React.memo(function TabButton({ active, icon: Icon, label, onClick, controls }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={[
        'group inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-[1.01]'
          : 'bg-[#0f172a] text-gray-200 hover:bg-[#141c2e] border border-white/10',
      ].join(' ')}
    >
      {Icon && <Icon size={16} className={active ? 'opacity-100' : 'opacity-80'} />}
      <span>{label}</span>
    </button>
  );
});

export default function AdminPersonalizePage() {
  const [tab, setTab] = React.useState(() => sessionStorage.getItem('ap_tab') || 'inbox');
  const [selectedQuestionId, setSelectedQuestionId] = React.useState(() => {
    const v = sessionStorage.getItem('ap_qid'); return v ? Number(v) : null;
  });
  const [activeRecId, setActiveRecId] = React.useState(() => {
    const v = sessionStorage.getItem('ap_recId'); return v ? Number(v) : null;
  });

  React.useEffect(() => { sessionStorage.setItem('ap_tab', tab); }, [tab]);
  React.useEffect(() => {
    if (selectedQuestionId) sessionStorage.setItem('ap_qid', String(selectedQuestionId));
    else sessionStorage.removeItem('ap_qid');
  }, [selectedQuestionId]);
  React.useEffect(() => {
    if (activeRecId) sessionStorage.setItem('ap_recId', String(activeRecId));
    else sessionStorage.removeItem('ap_recId');
  }, [activeRecId]);

  React.useEffect(() => {
    const h = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setTab('inbox');
      if (e.key === '2') setTab('rec');
      if (e.key === '3') setTab('templates');
      if (e.key === '4') setTab('followups');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="p-4 sm:p-6 text-white space-y-5 relative">
      {/* Rich dark background (not plain gray) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1220]" />
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_10%_-10%,rgba(59,130,246,0.2),transparent),radial-gradient(800px_400px_at_90%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(900px_600px_at_50%_110%,rgba(16,185,129,0.12),transparent)]" />
      </div>

      {/* Header */}
      <Card className="px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="text-blue-400" size={22} />
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Personalize — Admin</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Triage requests, craft & send recommendations, manage templates, track follow-ups.
            </p>
          </div>
          <div role="tablist" aria-label="Admin personalize tabs" className="flex flex-wrap gap-2">
            <TabButton active={tab==='inbox'}     icon={Inbox}  label="Inbox"          controls="panel-inbox"     onClick={() => setTab('inbox')} />
            <TabButton active={tab==='rec'}       icon={Wand2}  label="Recommendation" controls="panel-rec"       onClick={() => setTab('rec')} />
            <TabButton active={tab==='templates'} icon={FileText} label="Templates"    controls="panel-templates" onClick={() => setTab('templates')} />
            <TabButton active={tab==='followups'} icon={Bell}   label="Follow-ups"     controls="panel-followups" onClick={() => setTab('followups')} />
          </div>
        </div>
      </Card>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {tab === 'inbox' && (
          <motion.section key="inbox" variants={fadeSlide} initial="initial" animate="animate" exit="exit">
            <Card className="p-3 sm:p-4">
              <QuestionsInbox
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={(id) => { setSelectedQuestionId(id); setTab('inbox'); }}
                onOpenRec={(recId) => { setActiveRecId(recId); setTab('rec'); }}
                onCreateRecForQuestion={(qid) => { setSelectedQuestionId(qid); setActiveRecId(null); setTab('rec'); }}
              />
            </Card>
          </motion.section>
        )}

        {tab === 'rec' && (
          <motion.section key="rec" variants={fadeSlide} initial="initial" animate="animate" exit="exit">
            <Card className="p-3 sm:p-4">
              <RecommendationDetail
                questionId={selectedQuestionId}
                recId={activeRecId}
                onBackToInbox={() => setTab('inbox')}
                onRecOpened={setActiveRecId}
              />
            </Card>
          </motion.section>
        )}

        {tab === 'templates' && (
          <motion.section key="templates" variants={fadeSlide} initial="initial" animate="animate" exit="exit">
            <Card className="p-3 sm:p-4">
              <TemplatesManager />
            </Card>
          </motion.section>
        )}

        {tab === 'followups' && (
          <motion.section key="followups" variants={fadeSlide} initial="initial" animate="animate" exit="exit">
            <Card className="p-3 sm:p-4">
              <FollowupsPanel />
            </Card>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
