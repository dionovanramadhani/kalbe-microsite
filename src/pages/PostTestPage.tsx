import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { POST_TEST_QUESTIONS } from "../data/dummyPostTest";
import {
  unlockReward,
  setPostTestCompleted,
  isPostTestCompleted,
} from "../data/rewardStore";
import { setSymposiumJoined } from "../data/symposiumStore";
import { PostTestScoreModal } from "../components/PostTestScoreModal";
import {
  getKalbePostTestByRefID,
  getKalbePostTestByID,
  submitKalbePostTest,
  getKalbeSymposiumsList,
  getKalbeSymposiumToday,
} from "../utils/kalbeApi";
import type {
  KalbePostTestDetail,
  SubmitKalbePostTestPayload,
} from "../utils/kalbeApi";

const QUESTIONS_PER_SECTION = 3;

interface QuestionOptionItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionItem {
  id: string;
  displayNumber: number;
  question: string;
  options: QuestionOptionItem[];
}

const getFallbackQuestions = (): QuestionItem[] => {
  return POST_TEST_QUESTIONS.map((q, idx) => ({
    id: String(q.id),
    displayNumber: idx + 1,
    question: q.question,
    options: q.options.map((opt, optIdx) => ({
      id: `opt-${q.id}-${optIdx}`,
      text: opt,
      isCorrect: q.correctAnswer !== undefined ? optIdx === q.correctAnswer : false,
    })),
  }));
};

export const PostTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symposiumId = searchParams.get("symposium_id");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [postTestDetail, setPostTestDetail] = useState<KalbePostTestDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentSection, setCurrentSection] = useState(0); // 0-indexed: 0, 1, 2
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(80);

  // Jika URL memiliki parameter symposium_id, tandai user sudah check-in/join simposium
  useEffect(() => {
    if (symposiumId) {
      setSymposiumJoined(true);
    }
  }, [symposiumId]);

  // Verifikasi status selesai post-test dan rentang waktu simposium
  useEffect(() => {
    let isSubscribed = true;
    const verifyAndCheckTiming = async () => {
      try {
        const todaySympo = await getKalbeSymposiumToday().catch(() => null);
        if (!isSubscribed) return;

        // Jika API menyatakan simposium belum selesai (misal hanya check-in participant), pastikan tidak diblokir
        if (todaySympo && todaySympo.is_completed === false) {
          setPostTestCompleted(false);
        } else if (todaySympo?.is_completed || isPostTestCompleted()) {
          navigate("/home", { replace: true });
          return;
        }

        if (todaySympo?.started_at) {
          const start = new Date(todaySympo.started_at);
          if (!isNaN(start.getTime()) && new Date() < start) {
            navigate("/home", { replace: true });
            return;
          }
        }
        if (todaySympo?.ended_at) {
          const end = new Date(todaySympo.ended_at);
          if (!isNaN(end.getTime()) && new Date() > end) {
            navigate("/home", { replace: true });
            return;
          }
        }
      } catch {
        if (isPostTestCompleted()) {
          navigate("/home", { replace: true });
        }
      }
    };
    verifyAndCheckTiming();
    return () => {
      isSubscribed = false;
    };
  }, [navigate]);

  // Fetch post test questions from API by symposium ref_id or direct post test id
  useEffect(() => {
    let isSubscribed = true;

    const fetchPostTest = async () => {
      setLoading(true);
      try {
        let activeRefId = symposiumId;
        if (!activeRefId) {
          // If symposium_id not in query, try fetching active symposium from API
          const sympos = await getKalbeSymposiumsList().catch(() => []);
          if (sympos && sympos.length > 0) {
            const activeSympo = sympos.find((s) => s.is_active) || sympos[0];
            activeRefId = activeSympo.id;
          }
        }

        if (activeRefId) {
          // 1. Try fetching post-test by symposium ref_id
          let detail = await getKalbePostTestByRefID(activeRefId).catch(() => null);

          // 2. If not found, check if activeRefId is the direct post_test_id
          if (!detail) {
            detail = await getKalbePostTestByID(activeRefId).catch(() => null);
          }

          // 3. If still not found and a symposium was provided, fallback to active symposium
          if (!detail) {
            const sympos = await getKalbeSymposiumsList().catch(() => []);
            const activeSympo = sympos.find((s) => s.is_active) || sympos[0];
            if (activeSympo && activeSympo.id !== activeRefId) {
              detail = await getKalbePostTestByRefID(activeSympo.id).catch(() => null);
            }
          }

          if (isSubscribed && detail && detail.questions && detail.questions.length > 0) {
            // 2 detik delay setelah data berhasil di get
            await new Promise((resolve) => setTimeout(resolve, 2000));
            if (!isSubscribed) return;
            setPostTestDetail(detail);
            const mappedQuestions: QuestionItem[] = detail.questions.map((q, qIdx) => ({
              id: q.id,
              displayNumber: qIdx + 1,
              question: q.question_text,
              options: q.options.map((o) => ({
                id: o.id,
                text: o.option_text,
                isCorrect: Boolean(o.is_correct),
              })),
            }));
            setQuestions(mappedQuestions);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load post-test from API, using fallback questions:", err);
      }

      if (isSubscribed) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!isSubscribed) return;
        setQuestions(getFallbackQuestions());
        setLoading(false);
      }
    };

    fetchPostTest();

    return () => {
      isSubscribed = false;
    };
  }, [symposiumId]);

  const totalSections = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_SECTION));

  // Questions for current section (3 per page)
  const currentQuestions = questions.slice(
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

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Check if all questions in the current section have been answered
  const isCurrentSectionComplete =
    currentQuestions.length > 0 &&
    currentQuestions.every((q) => Boolean(answers[q.id]));

  // Check if all questions overall have been answered
  const isAllQuestionsAnswered =
    questions.length > 0 && questions.every((q) => Boolean(answers[q.id]));

  const isLastSection = currentSection === totalSections - 1;
  const isActionDisabled = isLastSection
    ? !isAllQuestionsAnswered || submitting
    : !isCurrentSectionComplete;

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      scrollToTop();
    } else {
      navigate("/symposium");
    }
  };

  const handleNextOrSubmit = async () => {
    if (isActionDisabled) return;

    if (!isLastSection) {
      setCurrentSection((prev) => prev + 1);
      scrollToTop();
    } else {
      // Hitung skor berdasarkan jawaban benar dan salah dengan range 0 - 100
      let correctCount = 0;
      let hasCorrectDefined = false;

      questions.forEach((q) => {
        const selectedOptId = answers[q.id];
        const selectedOpt = q.options.find((o) => o.id === selectedOptId);
        if (selectedOpt && typeof selectedOpt.isCorrect === "boolean") {
          hasCorrectDefined = true;
          if (selectedOpt.isCorrect) {
            correctCount++;
          }
        }
      });

      // Skor menyesuaikan dengan banyaknya pertanyaan: (jawaban_benar / total_pertanyaan) * 100
      const calculatedScore =
        questions.length > 0
          ? hasCorrectDefined
            ? Math.min(100, Math.max(0, Math.round((correctCount / questions.length) * 100)))
            : 100
          : 0;

      setFinalScore(calculatedScore);

      // Always resolve postTestDetail and submit answers to API
      setSubmitting(true);
      try {
        let activePostTest = postTestDetail;
        if (!activePostTest || !activePostTest.id) {
          const sympos = await getKalbeSymposiumsList().catch(() => []);
          const activeSympo = sympos.find((s) => s.is_active) || sympos[0];
          const activeRef = symposiumId || activeSympo?.id;
          if (activeRef) {
            activePostTest = await getKalbePostTestByRefID(activeRef).catch(() => null);
            if (!activePostTest) {
              activePostTest = await getKalbePostTestByID(activeRef).catch(() => null);
            }
          }
        }

        if (activePostTest && activePostTest.id) {
          const payload: SubmitKalbePostTestPayload = {
            post_test_id: activePostTest.id,
            answers: questions.map((q) => ({
              question_id: q.id,
              option_ids: answers[q.id] ? [answers[q.id]] : [],
            })),
          };
          await submitKalbePostTest(payload).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "";
            // Jika sudah pernah menjawab (already answered), lanjutkan saja
            if (!msg.toLowerCase().includes("already")) {
              console.warn("Submit post test warning:", err);
            }
          });
        }
      } catch (err) {
        console.warn("Submit post test API error:", err);
      } finally {
        setSubmitting(false);
      }

      // Display score modal
      setShowScoreModal(true);
    }
  };

  const handleConfirmScore = () => {
    setShowScoreModal(false);
    // Saat OK ditekan, unlock reward, mark completed, dan navigasi ke home untuk menampilkan modal congratulation
    unlockReward("morinaga-sympo");
    setPostTestCompleted(true);
    setSymposiumJoined(true);
    navigate("/home", {
      state: {
        showPostTestSuccessModal: true,
        submittedAnswersCount: Object.keys(answers).length,
        totalQuestionsCount: questions.length,
      },
    });
  };

  return (
    <div
      className="font-kalbe relative h-full w-full flex flex-col justify-between items-center bg-cover bg-top select-none px-4 pt-4 pb-5 overflow-hidden"
      style={{
        backgroundImage: `url('/assets/red-and-white-curve-bg.webp')`,
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
            src="/assets/post-test-arrow.webp"
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
            {loading ? (
              <div className="w-full flex-1 overflow-hidden space-y-5 pt-1 pb-2">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="w-full animate-pulse space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-[22px] h-[22px] rounded-full bg-gray-200/90 shrink-0" />
                      <div className="w-3/4 h-4 bg-gray-200/90 rounded mt-0.5" />
                    </div>
                    <div className="pl-7 space-y-2.5">
                      {[1, 2, 3].map((optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2.5">
                          <div className="w-[17px] h-[17px] rounded-full bg-gray-200/80 shrink-0" />
                          <div className="w-1/2 h-3.5 bg-gray-200/70 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                          {q.displayNumber}
                        </div>
                        <p className="text-[12px] text-[#1E1E1E] leading-snug">
                          {q.question}
                        </p>
                      </div>

                      {/* Radio Options List */}
                      <div className="pl-7 space-y-2.5">
                        {q.options.map((opt) => {
                          const isChecked = selectedOpt === opt.id;

                          return (
                            <label
                              key={opt.id}
                              onClick={() => handleSelectOption(q.id, opt.id)}
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
                                {opt.text}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Futuristic Red Camera Overlay Frame */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backgroundImage: `url('/assets/red-and-white-curve-bg-long.webp')`,
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
            backgroundImage: `url('/assets/red-button.webp')`,
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
            {submitting ? "MENGIRIM..." : isLastSection ? "KIRIM" : "SELANJUTNYA"}
          </span>
        </button>
      </div>

      {/* Post Test Score Modal */}
      <PostTestScoreModal
        isOpen={showScoreModal}
        score={finalScore}
        onConfirm={handleConfirmScore}
      />
    </div>
  );
};
