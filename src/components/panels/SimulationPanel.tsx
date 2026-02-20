/**
 * SimulationPanel — A floating overlay control bar for simulation mode.
 * Positioned at the bottom-center of the canvas.
 */
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/store/simulationStore';
import { useDiagramStore } from '@/store/diagramStore';
import { traceFlowPath, computeBlastRadius } from '@/utils/graphTraversal';
import type { SimulationSpeed, ChaosSubMode } from '@/types/simulation';
import { SimulationStats } from './SimulationStats';
import { ChaosEventLog } from './ChaosEventLog';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  BoltIcon,
  ForwardIcon,
  BackwardIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FireIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

const SPEED_OPTIONS: SimulationSpeed[] = [0.25, 0.5, 1, 2, 4];

interface SimulationPanelProps {
  onClose: () => void;
}

export function SimulationPanel({ onClose }: SimulationPanelProps) {
  const {
    mode,
    isRunning,
    speed,
    sourceNodeId,
    failedNodeIds,
    flowPath,
    currentStepIndex,
    steppingMode,
    showStats,
    setMode,
    startFlowSimulation,
    startFailureSimulation,
    stop,
    pause,
    resume,
    setSpeed,
    setFailureResults,
    setSteppingMode,
    stepForward,
    stepBackward,
    toggleStats,
    roundTripEnabled,
    toggleRoundTrip,
    // Chaos
    chaosConfig,
    chaosIsAutoRunning,
    chaosRound,
    showChaosLog,
    setChaosConfig,
    setChaosSubMode,
    startChaos,
    stopChaos,
    toggleChaosLog,
    clearChaosFailures,
    reset,
  } = useSimulationStore();

  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);

  // Get source node label for display
  const sourceNode = sourceNodeId
    ? nodes.find((n) => n.id === sourceNodeId)
    : null;
  const sourceLabel = sourceNode
    ? (sourceNode.data as Record<string, unknown>)?.label as string || 'Unknown'
    : null;

  const handlePlayFlow = () => {
    if (sourceNodeId) {
      if (steppingMode) {
        // In stepping mode, start paused at step 0
        const path = traceFlowPath(nodes, edges, sourceNodeId);
        startFlowSimulation(sourceNodeId, path);
        pause(); // Immediately pause — user advances via step buttons
      } else {
        const path = traceFlowPath(nodes, edges, sourceNodeId);
        startFlowSimulation(sourceNodeId, path);
      }
    }
  };

  const handlePlayFailure = () => {
    if (failedNodeIds.length > 0) {
      const blast = computeBlastRadius(nodes, edges, failedNodeIds);
      setFailureResults(blast.affectedNodeIds, blast.brokenEdgeIds, blast.levels);
      startFailureSimulation();
    }
  };

  const handleToggleStepping = () => {
    if (steppingMode) {
      setSteppingMode(false);
      // If we were stepping and simulation is paused, resume continuous
      if (isRunning && flowPath) {
        resume();
      }
    } else {
      setSteppingMode(true);
      // If simulation is running, pause it for stepping
      if (isRunning) {
        pause();
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Status message
  const getStatusText = () => {
    if (mode === 'idle') return 'Select a mode to begin';
    if (mode === 'flow') {
      if (!sourceNodeId) return 'Click a node to set as source';
      if (steppingMode && flowPath) {
        const maxSteps = flowPath.levels?.length ?? flowPath.steps.length;
        const stepLabel = currentStepIndex >= 0 && currentStepIndex < maxSteps
          ? (() => {
              if (flowPath.levels) {
                const level = flowPath.levels[currentStepIndex];
                const stepCount = level.steps.length;
                return `Level ${currentStepIndex + 1}/${maxSteps}: ${stepCount} branch${stepCount > 1 ? 'es' : ''}`;
              }
              const step = flowPath.steps[currentStepIndex];
              const fromNode = nodes.find(n => n.id === step.fromNodeId);
              const toNode = nodes.find(n => n.id === step.toNodeId);
              const fromLabel = (fromNode?.data as Record<string, unknown>)?.label as string || step.fromNodeId;
              const toLabel = (toNode?.data as Record<string, unknown>)?.label as string || step.toNodeId;
              const proto = step.protocol ? ` [${step.protocol.toUpperCase()}]` : '';
              return `Step ${currentStepIndex + 1}/${maxSteps}: ${fromLabel} →${proto} ${toLabel}`;
            })()
          : `Ready to step — ${maxSteps} ${flowPath.levels ? 'levels' : 'hops'}`;
        return stepLabel;
      }
      if (isRunning) return `Tracing from: ${sourceLabel}`;
      return `Source: ${sourceLabel} — Press Play`;
    }
    if (mode === 'failure') {
      if (failedNodeIds.length === 0) return 'Click nodes to mark as failed';
      if (isRunning) return `${failedNodeIds.length} node(s) failed — showing blast radius`;
      return `${failedNodeIds.length} node(s) marked — Press Play`;
    }
    if (mode === 'chaos') {
      if (chaosIsAutoRunning) {
        const subLabel = chaosConfig.subMode === 'random-failure' ? 'Random Failure' : 'Network Partition';
        return `${subLabel} — Round ${chaosRound} (every ${chaosConfig.intervalMs / 1000}s)`;
      }
      return `Chaos: ${chaosConfig.subMode === 'random-failure' ? 'Random Failure' : 'Network Partition'} — Press Play`;
    }
    return '';
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {/* Chaos event log (rendered above everything) */}
      {mode === 'chaos' && showChaosLog && (
        <ChaosEventLog />
      )}

      {/* Stats panel (rendered above the control bar) */}
      {showStats && isRunning && (
        <SimulationStats />
      )}

      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 px-4 py-3 flex items-center gap-3 min-w-[480px]">
        {/* Simulation indicator */}
        <div className="flex items-center gap-1.5">
          <BoltIcon className={cn(
            'w-4 h-4',
            isRunning ? 'text-amber-500 animate-pulse' : 'text-zinc-400'
          )} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Simulate
          </span>
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Mode selector */}
        <div className="flex gap-1">
          <button
            onClick={() => setMode('flow')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              mode === 'flow'
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Flow Simulation — Trace request path"
          >
            <SignalIcon className="w-3.5 h-3.5" />
            Flow
          </button>
          <button
            onClick={() => setMode('failure')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              mode === 'failure'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Failure Simulation — Blast radius analysis"
          >
            <ExclamationTriangleIcon className="w-3.5 h-3.5" />
            Failure
          </button>
          <button
            onClick={() => setMode('chaos')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              mode === 'chaos'
                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Chaos Mode — Random failures & network partition"
          >
            <FireIcon className="w-3.5 h-3.5" />
            Chaos
          </button>
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          {mode === 'chaos' ? (
            // Chaos mode: toggle auto-run
            chaosIsAutoRunning ? (
              <button
                onClick={stopChaos}
                className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                title="Stop Chaos"
              >
                <PauseIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { clearChaosFailures(); startChaos(); }}
                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                title="Start Chaos"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )
          ) : !isRunning || (steppingMode && flowPath) ? (
            <button
              onClick={mode === 'flow' ? handlePlayFlow : handlePlayFailure}
              disabled={mode === 'idle' || (mode === 'flow' && !sourceNodeId) || (mode === 'failure' && failedNodeIds.length === 0) || (steppingMode && isRunning)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                mode === 'idle' || (mode === 'flow' && !sourceNodeId) || (mode === 'failure' && failedNodeIds.length === 0) || (steppingMode && isRunning)
                  ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              )}
              title="Play"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={pause}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              title="Pause"
            >
              <PauseIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => { if (mode === 'chaos') { stopChaos(); clearChaosFailures(); } else { stop(); } }}
            disabled={mode !== 'chaos' && !isRunning && !sourceNodeId && failedNodeIds.length === 0}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              !isRunning && !sourceNodeId && failedNodeIds.length === 0
                ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Stop"
          >
            <StopIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Step controls (flow mode only) */}
        {mode === 'flow' && (
          <>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleStepping}
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                  steppingMode
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                    : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
                title="Toggle step-by-step debugger"
              >
                Step
              </button>
              {steppingMode && (
                <>
                  <button
                    onClick={stepBackward}
                    disabled={currentStepIndex <= 0}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      currentStepIndex <= 0
                        ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    )}
                    title="Step backward"
                  >
                    <BackwardIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={stepForward}
                    disabled={!flowPath || currentStepIndex >= (flowPath.levels?.length ?? flowPath.steps.length) - 1}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      !flowPath || currentStepIndex >= (flowPath.levels?.length ?? flowPath.steps.length) - 1
                        ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    )}
                    title="Step forward"
                  >
                    <ForwardIcon className="w-3.5 h-3.5" />
                  </button>
                  {flowPath && currentStepIndex >= 0 && (
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 tabular-nums">
                      {currentStepIndex + 1}/{flowPath.levels?.length ?? flowPath.steps.length}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Round-trip toggle */}
            {!steppingMode && (
              <button
                onClick={toggleRoundTrip}
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1',
                  roundTripEnabled
                    ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700'
                    : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
                title="Toggle request-response round trip"
              >
                <ArrowPathIcon className="w-3 h-3" />
                RT
              </button>
            )}
          </>
        )}

        {/* Chaos controls */}
        {mode === 'chaos' && (
          <>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              {/* Sub-mode selector */}
              <select
                value={chaosConfig.subMode}
                onChange={(e) => setChaosSubMode(e.target.value as ChaosSubMode)}
                disabled={chaosIsAutoRunning}
                className="text-[10px] bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="random-failure">Random Failure</option>
                <option value="network-partition">Partition</option>
              </select>

              {/* Interval */}
              <select
                value={chaosConfig.intervalMs}
                onChange={(e) => setChaosConfig({ intervalMs: Number(e.target.value) })}
                disabled={chaosIsAutoRunning}
                className="text-[10px] bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                title="Interval between chaos rounds"
              >
                <option value={2000}>2s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={8000}>8s</option>
                <option value={10000}>10s</option>
              </select>

              {/* Max failures per round (random-failure only) */}
              {chaosConfig.subMode === 'random-failure' && (
                <select
                  value={chaosConfig.maxFailuresPerRound}
                  onChange={(e) => setChaosConfig({ maxFailuresPerRound: Number(e.target.value) })}
                  disabled={chaosIsAutoRunning}
                  className="text-[10px] bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  title="Max nodes to fail per round"
                >
                  <option value={1}>1/round</option>
                  <option value={2}>2/round</option>
                  <option value={3}>3/round</option>
                  <option value={5}>5/round</option>
                </select>
              )}

              {/* Event log toggle */}
              <button
                onClick={toggleChaosLog}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  showChaosLog
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
                title="Toggle chaos event log"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">Speed:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value) as SimulationSpeed)}
            className="text-xs bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

        {/* Status text */}
        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1 truncate min-w-0">
          {getStatusText()}
        </span>

        {/* Stats toggle */}
        {(mode === 'flow' || mode === 'failure' || mode === 'chaos') && isRunning && (
          <button
            onClick={toggleStats}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              showStats
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
            title="Toggle stats panel"
          >
            <ChartBarIcon className="w-4 h-4" />
          </button>
        )}

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Close simulation"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
