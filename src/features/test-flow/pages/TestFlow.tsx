import { useTestFlow } from '../hooks/useTestFlow';
import AuthPage from './AuthPage';
import ModeSelectPage from './ModeSelectPage';
import TopicSelectPage from './TopicSelectPage';
import MotivationQuestionPage from './MotivationQuestionPage';
import QuestionPage from './QuestionPage';
import ResultsPage from './ResultsPage';
import ExitConfirmModal from '../../../components/ExitConfirmModal';
import SessionTimer from '../../../components/SessionTimer';
import { AlertIcon, SpinnerIcon } from '../../../components/Icons';
import ThemeToggle from '../../../components/ThemeToggle';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight font-child">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <SpinnerIcon className="w-10 h-10 text-coral dark:text-coral-light" />
      </div>
    </div>
  );
}

export default function TestFlow() {
  const flow = useTestFlow();

  if (flow.loading || flow.isLoadingItems) {
    return <LoadingScreen />;
  }

  if (flow.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-midnight font-child p-4">
        <ThemeToggle className="fixed top-4 right-4 z-50" />
        <div className="bg-white dark:bg-surface-dark rounded-[28px] shadow-xl shadow-orange-900/8 dark:shadow-black/30 p-8 max-w-md text-center animate-bounce-in">
          <AlertIcon className="w-14 h-14 text-rose dark:text-rose mx-auto" />
          <h2 className="text-xl font-display font-bold text-charcoal dark:text-warm-white mb-2">Ошибка</h2>
          <p className="text-charcoal/50 dark:text-warm-white/50 mb-4">{flow.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-coral text-white font-display font-bold rounded-2xl hover:bg-coral-hover transition-colors cursor-pointer"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const exitModal = flow.showExitConfirm && (
    <ExitConfirmModal
      onCancel={flow.dismissExitConfirm}
      onConfirm={flow.confirmEarlyExit}
    />
  );

  const showTimer =
    flow.session?.startedAt &&
    flow.testDurationMinutes > 0 &&
    (flow.step === 'motivation' || flow.step === 'topic-select' || flow.step === 'question');

  const timer = showTimer ? (
    <SessionTimer
      startedAt={flow.session!.startedAt!}
      durationMinutes={flow.testDurationMinutes}
      onExpired={flow.handleTimerExpired}
    />
  ) : null;

  switch (flow.step) {
    case 'auth':
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          <AuthPage onSubmit={flow.handleAuth} />
        </>
      );
    case 'mode':
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          <ModeSelectPage onSelect={flow.handleModeSelect} />
        </>
      );
    case 'motivation':
      if (!flow.currentMotivation) {
        return <LoadingScreen />;
      }
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          {timer}
          {exitModal}
          <MotivationQuestionPage
            question={flow.currentMotivation}
            onAnswer={flow.handleMotivationAnswer}
          />
        </>
      );
    case 'topic-select':
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          {timer}
          {exitModal}
          <TopicSelectPage
            topics={flow.topics}
            completedTopicIds={flow.session?.completedTopicIds ?? []}
            onSelect={flow.handleTopicSelect}
            onExit={flow.handleEarlyExit}
          />
        </>
      );
    case 'question':
      if (!flow.currentItem || !flow.session?.currentTopicId) {
        return <LoadingScreen />;
      }
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          {timer}
          {exitModal}
          <QuestionPage
            item={flow.currentItem}
            topicName={
              flow.topics.find((t) => t.id === flow.session!.currentTopicId)?.name ?? ''
            }
            questionNumber={(flow.session.shownItemIds?.length ?? 0) + 1}
            totalQuestions={flow.totalQuestionsInTopic}
            onAnswer={flow.handleAnswer}
            onExit={flow.handleEarlyExit}
          />
        </>
      );
    case 'results':
      return (
        <>
          <ThemeToggle className="fixed top-4 right-4 z-50" />
          <ResultsPage
            topics={flow.topics}
            allAnswers={flow.session?.allAnswers ?? []}
            itemBValues={flow.itemBValues}
            isEarlyExit={flow.isEarlyExit}
            isForceTerminated={flow.isForceTerminated}
            onFinish={flow.handleFinish}
          />
        </>
      );
  }
}
