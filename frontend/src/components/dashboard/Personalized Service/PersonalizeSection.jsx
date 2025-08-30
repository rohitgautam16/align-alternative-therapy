// src/components/personalize/PersonalizeSection.jsx
import React from 'react';
import NewQuestionForm from './NewQuestionForm';
import QuestionsList from './QuestionsList';
import QuestionDetail from './QuestionDetail';
import FollowupsList from './FollowUpList';
import RecommendationsShelf from './RecommendationsShelf';

// Cool glass tokens (match cards)
const surface = `
  rounded-2xl
  bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.10),transparent),
      radial-gradient(1200px_600px_at_110%_120%,rgba(167,139,250,0.10),transparent)]
  from-[#0b0f19] to-[#0a0e17] bg-gradient-to-b
  backdrop-blur-sm shadow-[0_12px_40px_-16px_rgba(0,0,0,0.8)] text-white
`;
const btnPrimary = 'px-4 py-2 rounded-lg text-white shadow transition focus:outline-none focus-visible:ring-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-600/30 focus-visible:ring-cyan-400/60 disabled:opacity-60';
const inputCx = 'px-3 py-2 rounded-lg bg-[#0b1220] text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600';

/** Segmented (glass) */
function Segmented({ value, onChange }) {
  return (
    <div className="relative inline-flex p-1 rounded-xl bg-white/10 backdrop-blur-sm" role="tablist" aria-label="Personalize tabs">
      {/* slider */}
      <div
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 transition-transform duration-200"
        style={{ transform: value === 'followups' ? 'translateX(100%)' : 'translateX(0%)' }}
        aria-hidden
      />
      {/* buttons */}
      <button
        type="button"
        onClick={() => onChange('questions')}
        className={`relative z-10 px-4 py-2 text-sm rounded-lg transition-colors duration-150 outline-none ${value === 'questions' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
        role="tab"
        aria-selected={value === 'questions'}
        aria-controls="panel-questions"
      >
        Requests
      </button>
      <button
        type="button"
        onClick={() => onChange('followups')}
        className={`relative z-10 px-4 py-2 text-sm rounded-lg transition-colors duration-150 outline-none ${value === 'followups' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
        role="tab"
        aria-selected={value === 'followups'}
        aria-controls="panel-followups"
      >
        Follow-ups
      </button>
    </div>
  );
}

export default function PersonalizeSection() {
  const [selectedQuestionId, setSelectedQuestionId] = React.useState(() => Number(sessionStorage.getItem('ps_selectedQuestionId')) || null);
  const [activeTab, setActiveTab] = React.useState(() => sessionStorage.getItem('ps_activeTab') || 'questions');
  const [showInlineNew, setShowInlineNew] = React.useState(false);

  const detailRef = React.useRef(null);
  const recsRef   = React.useRef(null);
  const reqsRef   = React.useRef(null);

  React.useEffect(() => {
    if (selectedQuestionId) sessionStorage.setItem('ps_selectedQuestionId', String(selectedQuestionId));
    else sessionStorage.removeItem('ps_selectedQuestionId');
  }, [selectedQuestionId]);
  React.useEffect(() => {
    sessionStorage.setItem('ps_activeTab', activeTab);
  }, [activeTab]);

  function handleCreated(id) {
    setSelectedQuestionId(id);
    setActiveTab('questions');
    setShowInlineNew(false);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  // Smooth scroll when a question tile is clicked
  function handleSelectQuestion(id) {
    setSelectedQuestionId(id);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  React.useEffect(() => {
    if (activeTab === 'followups') setShowInlineNew(false);
  }, [activeTab]);

  return (
    <div className="relative p-4 sm:p-6 space-y-6">
      {/* Ambient bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Header (unchanged) */}
      <div className={`${surface} px-6 py-5 sm:px-8 sm:py-6 relative overflow-hidden`}>
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="min-w-[260px]">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Personalized Support</h1>
            <p className="mt-2 text-sm text-gray-300 max-w-md leading-relaxed">
              Get tailored playlists and tracks based on your requests. Refine with follow-ups anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setShowInlineNew((s) => !s)}
              aria-expanded={showInlineNew}
              aria-controls="new-request-collapsible"
            >
              {showInlineNew ? 'Close' : 'New Request'}
            </button>
            <Segmented value={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </div>

      {/* Inline New Request */}
      <div
        id="new-request-collapsible"
        className={`
          ${surface}
          overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out
          ${showInlineNew ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'}
        `}
      >
        {showInlineNew && (
          <div className="p-4 sm:p-6">
            <NewQuestionForm onCreated={handleCreated} inputClassName={inputCx} buttonClassName={btnPrimary} />
          </div>
        )}
      </div>

      {/* BODY */}
      {activeTab === 'followups' ? (
        <section id="panel-followups" role="tabpanel" aria-labelledby="Follow-ups" className={`${surface} p-4 sm:p-6`}>
          <FollowupsList />
        </section>
      ) : (
        <div id="panel-questions" role="tabpanel" aria-labelledby="Requests" className="space-y-6">
          {/* Recommendations — horizontal carousel */}
          <section ref={recsRef}>
            <div className="mb-4 text-3xl font-medium text-white">Your Recommendations</div>
            {/* overflow-x container; child component renders row when carousel prop is set */}
            <div className="overflow-x-auto overflow-y-visible snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent -mx-2 sm:-mx-3 px-2 sm:px-3">
              <RecommendationsShelf carousel />
            </div>
          </section>

          {/* Requests — horizontal carousel */}
          <section ref={reqsRef} className="space-y-3">
            <div className="mb-2 text-3xl font-medium text-white">Your Requests</div>
            <div className="overflow-x-auto overflow-y-visible snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent -mx-2 sm:-mx-3 px-2 sm:px-3">
              <QuestionsList onSelect={handleSelectQuestion} selectedId={selectedQuestionId} carousel />
            </div>
          </section>

          {/* Question Details */}
          <section ref={detailRef}>
            {selectedQuestionId ? (
              <QuestionDetail questionId={selectedQuestionId} />
            ) : (
              <div className={`${surface} p-8 text-center text-gray-300`}>
                <div className="text-base font-medium mb-1">No request selected</div>
                <div className="text-sm">Pick a request above to view the conversation and recommendations.</div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
