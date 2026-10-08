import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { POST_TEST_QUESTIONS } from "../data/dummyPostTest";
import {
  unlockReward,
  setPostTestCompleted,
  isPostTestCompleted,
} from "../data/rewardStore";
import { setSymposiumJoined } from "../data/symposiumStore";

const QUESTIONS_PER_SECTION = 3;

export const PostTestPage: React.FC = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Jika user sudah menyelesaikan post-test, tidak boleh akses post-test lagi
  useEffect(() => {
    if (isPostTestCompleted()) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const [currentSection, setCurrentSection] = useState(0); // 0-indexed: 0, 1, 2
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const totalSections = Math.ceil(POST_TEST_QUESTIONS.length / QUESTIONS_PER_SECTION);

  // Questions for current section
  const currentQuestions = POST_TEST_QUESTIONS.slice(
    currentSection * QUESTIONS_PER_SECTION,
    (currentSection + 1) * QUESTIONS_PER_SECTION,
  );

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Check if all questions in the current section have been answered
  const isCurrentSectionComplete = currentQuestions.every(
    (q) => answers[q.id] !== undefined,
  );

  // Check if all questions overall (all 9 questions) have been answered
  const isAllQuestionsAnswered = POST_TEST_QUESTIONS.every(
    (q) => answers[q.id] !== undefined,
  );

  const isLastSection = currentSection === totalSections - 1;
  const isActionDisabled = isLastSection
    ? !isAllQuestionsAnswered
    : !isCurrentSectionComplete;

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      scrollToTop();
    } else {
      navigate("/symposium");
    }
  };

  const handleNextOrSubmit = () => {
    if (isActionDisabled) return;

    if (!isLastSection) {
      setCurrentSection((prev) => prev + 1);
      scrollToTop();
    } else {
      // Last section -> Unlock reward, mark post test completed & redirect to /home with pop-up modal state
      unlockReward("morinaga-sympo");
      setPostTestCompleted(true);
      setSymposiumJoined(true);
      navigate("/home", {
        state: {
          showPostTestSuccessModal: true,
          submittedAnswersCount: Object.keys(answers).length,
          totalQuestionsCount: POST_TEST_QUESTIONS.length,
        },
      });
    }
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-4 pb-5 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.png')`,
        fontFamily: "KalbeGeometric, Arial, sans-serif",
      }}
    >
      {/* Top Header Bar */}
      <div className="relative w-full flex items-center justify-center pt-1 pb-2 shrink-0">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute left-0 cursor-pointer active:scale-95 transition-transform"
          title="Kembali"
        >
          <img
            src="/assets/post-test-arrow.png"
            alt="Back"
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
        </button>

        {/* Page Title */}
        <h1 className="text-[20px] font-bold text-[#C70412] tracking-wide">Post Test</h1>
      </div>

      {/* Main Futuristic Card Sheet with Camera Frame asset */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center my-1 min-h-0">
        <div className="relative w-full max-w-[365px] h-full max-h-[580px] flex flex-col items-center justify-center shrink-0">
          {/* Card Inner White Container clipped with chamfer */}
          <div
            className="relative w-full h-full bg-white flex flex-col pt-4 pb-3 px-5 overflow-hidden shadow-sm"
            style={{
              clipPath:
                "polygon(22px 0%, calc(100% - 22px) 0%, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0% calc(100% - 22px), 0% 22px)",
            }}
          >
            {/* Stepper Progress Bar */}
            <div className="w-full flex items-center justify-between gap-2 pt-1 pb-3 shrink-0">
              {/* Stepper Pill Indicators */}
              <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                {Array.from({ length: totalSections }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-[7px] flex-1 rounded-full transition-all duration-300 ${
                      idx <= currentSection ? "bg-[#C70412] shadow-sm" : "bg-[#E5E7EB]"
                    }`}
                  />
                ))}
              </div>

              {/* Progress Count (e.g. 1/3, 2/3, 3/3) */}
              <div className="text-[14px] font-bold text-[#1E1E1E] shrink-0 font-mono ml-2">
                {currentSection + 1}/{totalSections}
              </div>
            </div>

            {/* Questions List (Scrollable if screen is small) */}
            <div
              ref={scrollContainerRef}
              className="w-full flex-1 overflow-y-auto pr-0.5 space-y-4 pt-1 pb-2 scrollbar-none"
            >
              {currentQuestions.map((q) => {
                const selectedOpt = answers[q.id];

                return (
                  <div key={q.id} className="w-full">
                    {/* Question Header: Red Badge Number + Question Text */}
                    <div className="flex items-start gap-2 mb-2.5">
                      <div className="w-[22px] h-[22px] rounded-full bg-[#C70412] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-sm">
                        {q.id}
                      </div>
                      <p className="text-[12px] text-[#1E1E1E] leading-snug">
                        {q.question}
                      </p>
                    </div>

                    {/* Radio Options List */}
                    <div className="pl-7 space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isChecked = selectedOpt === optIdx;

                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className="flex items-start gap-2.5 cursor-pointer group select-none py-0.5"
                          >
                            <div
                              className={`w-[17px] h-[17px] shrink-0 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                                isChecked
                                  ? "border-[#C70412] bg-[#C70412]"
                                  : "border-gray-400 bg-white group-hover:border-gray-600"
                              }`}
                            >
                              {isChecked && (
                                <div className="w-[6px] h-[6px] rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-[12px] text-[#374151] font-normal leading-snug group-hover:text-black flex-1">
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Futuristic Red Camera Overlay Frame */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `url('/assets/red-and-white-curve-bg-long.png')`,
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      </div>

      {/* Bottom Action Button: KIRIM / SELANJUTNYA */}
      <div className="relative w-full flex justify-center items-center pt-2 pb-1 shrink-0 z-20">
        <button
          onClick={handleNextOrSubmit}
          disabled={isActionDisabled}
          className={`relative w-[250px] h-[52px] flex items-center justify-center transition-all duration-200 ${
            isActionDisabled
              ? "opacity-45 cursor-not-allowed filter grayscale"
              : "cursor-pointer active:scale-95 hover:brightness-105"
          }`}
          style={{
            backgroundImage: `url('/assets/red-button.png')`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
          }}
          title={
            isActionDisabled
              ? isLastSection
                ? "Lengkapi semua jawaban untuk mengirim"
                : "Jawab semua soal di halaman ini terlebih dahulu"
              : undefined
          }
        >
          <span className="text-white font-extrabold text-[16px] tracking-wider uppercase drop-shadow">
            {isLastSection ? "KIRIM" : "SELANJUTNYA"}
          </span>
        </button>
      </div>
    </div>
  );
};
