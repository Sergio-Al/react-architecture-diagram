import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useOnboardingStore } from '@/store/onboardingStore';
import { emptyCompletedSteps } from '@/utils/onboarding';

const STORAGE_KEY = 'architecture-diagram-onboarding';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

const freshStoreState = () =>
  useOnboardingStore.setState({
    completedSteps: emptyCompletedSteps(),
    dismissed: false,
    initialized: false,
  });

describe('onboardingStore', () => {
  // The global test setup stubs localStorage with no-op vi.fn()s. zustand's
  // `persist` caches that object at import time, so we give *its* methods a real
  // in-memory implementation (rather than swapping the global, which persist
  // would never see).
  beforeEach(() => {
    const map = new Map<string, string>();
    asMock(localStorage.getItem).mockImplementation((k: string) => (map.has(k) ? map.get(k)! : null));
    asMock(localStorage.setItem).mockImplementation((k: string, v: string) => void map.set(k, v));
    asMock(localStorage.removeItem).mockImplementation((k: string) => void map.delete(k));
    freshStoreState();
  });
  afterEach(() => {
    asMock(localStorage.getItem).mockReset();
    asMock(localStorage.setItem).mockReset();
    asMock(localStorage.removeItem).mockReset();
  });

  it('completeStep latches a step and is idempotent', () => {
    const { completeStep } = useOnboardingStore.getState();
    completeStep('add-node');
    expect(useOnboardingStore.getState().completedSteps['add-node']).toBe(true);

    // Idempotent: calling again does not throw or flip other steps
    completeStep('add-node');
    expect(useOnboardingStore.getState().completedSteps['add-node']).toBe(true);
    expect(useOnboardingStore.getState().completedSteps['connect-nodes']).toBe(false);
  });

  it('dismiss hides the checklist', () => {
    useOnboardingStore.getState().dismiss();
    expect(useOnboardingStore.getState().dismissed).toBe(true);
  });

  it('initialize auto-dismisses only on a fresh record with existing content', () => {
    // Fresh record + existing content => dismissed
    useOnboardingStore.getState().initialize(true);
    expect(useOnboardingStore.getState().dismissed).toBe(true);
    expect(useOnboardingStore.getState().initialized).toBe(true);

    // Subsequent calls are no-ops even if args change
    freshStoreState();
    useOnboardingStore.getState().initialize(false);
    expect(useOnboardingStore.getState().dismissed).toBe(false);
    expect(useOnboardingStore.getState().initialized).toBe(true);
    useOnboardingStore.getState().initialize(true); // already initialized -> ignored
    expect(useOnboardingStore.getState().dismissed).toBe(false);
  });

  it('reset clears progress, un-dismisses, and marks initialized so the gate will not re-dismiss', () => {
    const s = useOnboardingStore.getState();
    s.completeStep('add-node');
    s.completeStep('connect-nodes');
    s.dismiss();

    s.reset();
    const after = useOnboardingStore.getState();
    expect(after.completedSteps).toEqual(emptyCompletedSteps());
    expect(after.dismissed).toBe(false);
    expect(after.initialized).toBe(true);
  });

  it('write path: persists progress to localStorage', () => {
    useOnboardingStore.getState().completeStep('add-node');
    useOnboardingStore.getState().dismiss();

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.completedSteps['add-node']).toBe(true);
    expect(parsed.state.dismissed).toBe(true);
  });

  it('read path: rehydrate loads a persisted blob back into state', async () => {
    const blob = {
      state: {
        completedSteps: { ...emptyCompletedSteps(), 'add-node': true, 'connect-nodes': true },
        dismissed: false,
        initialized: true,
      },
      version: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));

    await useOnboardingStore.persist.rehydrate();

    const state = useOnboardingStore.getState();
    expect(state.completedSteps['add-node']).toBe(true);
    expect(state.completedSteps['connect-nodes']).toBe(true);
    expect(state.completedSteps['set-contract']).toBe(false);
    expect(state.initialized).toBe(true);
  });
});
