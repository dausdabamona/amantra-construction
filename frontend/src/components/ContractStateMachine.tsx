import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useContractStateStore, ContractState, stateLabels, stateColors } from '@/stores/contractStateStore';

/**
 * State Machine Visualizer & Interaction Component
 * Displays contract state with all guards, rights, obligations, and transitions
 */
export const ContractStateMachine: React.FC<{ contractId: string }> = ({ contractId }) => {
  const store = useContractStateStore();
  const [selectedState, setSelectedState] = useState<ContractState | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [nextStateAction, setNextStateAction] = useState<(() => Promise<void>) | null>(null);
  const [cooldownCountdown, setCooldownCountdown] = useState<number>(0);

  useEffect(() => {
    // Fetch initial state
    store.fetchStateContext(contractId);
  }, [contractId]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!store.cooldownStatus?.isActive) return;

    const interval = setInterval(() => {
      const remaining = store.cooldownStatus?.remainingMs || 0;
      setCooldownCountdown(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
        store.fetchCooldownStatus(contractId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [store.cooldownStatus?.isActive]);

  const stateMetadata = store.currentState !== null ? store.getStateMetadata(store.currentState) : null;

  const handleTransition = async (action: () => Promise<void>) => {
    try {
      setShowConfirmation(false);
      await action();
      toast.success('Transition successful');
    } catch (error: any) {
      toast.error(error.message || 'Transition failed');
    }
  };

  if (!store.currentState) {
    return <div className="p-4 text-center text-gray-500">Loading contract state...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current State Display */}
      <div className={`p-6 rounded-lg border-2 bg-${stateColors[store.currentState]}-50 border-${stateColors[store.currentState]}-300`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Current State: {stateLabels[store.currentState]}
        </h2>
        <p className="text-sm text-gray-600">State {store.currentState}</p>
      </div>

      {/* Critical Warnings */}
      {store.currentState === ContractState.CONTRACT_ACTIVE_LOCKED && (
        <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300">
          <h3 className="font-bold text-amber-900 mb-2">⚠️ Contract Locked</h3>
          <p className="text-sm text-amber-800 mb-3">
            This contract is now immutable. NO modifications are possible.
          </p>
          {store.cooldownStatus?.isActive && (
            <div className="p-3 bg-amber-100 rounded-lg">
              <p className="font-mono text-amber-900">
                Cooldown: {cooldownCountdown} seconds remaining
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Execution cannot start before cooldown expires
              </p>
            </div>
          )}
        </div>
      )}

      {store.currentState === ContractState.CONTRACT_CLOSED_AND_ARCHIVED && (
        <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
          <h3 className="font-bold text-gray-900 mb-2">✅ Contract Archived</h3>
          <p className="text-sm text-gray-700">
            This contract is closed and archived. Read-only access only. No further transitions possible.
          </p>
        </div>
      )}

      {store.currentState === ContractState.EXCEPTION_AND_FORCE_MAJEURE && (
        <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
          <h3 className="font-bold text-red-900 mb-2">🚨 Emergency Active</h3>
          <p className="text-sm text-red-800">
            Contract is in emergency/dispute mode. Dispute resolution window: 20 days
          </p>
        </div>
      )}

      {/* Rights & Obligations */}
      {stateMetadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rights */}
          <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
            <h3 className="font-bold text-green-900 mb-3">Current Rights</h3>
            <ul className="space-y-2">
              {stateMetadata.rights.map((right, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <span className="text-green-800">{right}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Obligations */}
          <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
            <h3 className="font-bold text-blue-900 mb-3">Current Obligations</h3>
            <ul className="space-y-2">
              {stateMetadata.obligations.map((obligation, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">→</span>
                  <span className="text-blue-800">{obligation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
            <h3 className="font-bold text-purple-900 mb-3">Responsible Party</h3>
            <p className="text-purple-800">{stateMetadata.responsibleParty}</p>
          </div>

          <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
            <h3 className="font-bold text-orange-900 mb-3">Deadline</h3>
            <p className="text-orange-800">{stateMetadata.deadline}</p>
          </div>
        </div>
      )}

      {/* Waiting For */}
      {stateMetadata && (
        <div className="p-4 rounded-lg border-2 border-cyan-200 bg-cyan-50">
          <h3 className="font-bold text-cyan-900 mb-2">⏳ Waiting For</h3>
          <p className="text-cyan-800">{stateMetadata.waitingFor}</p>
        </div>
      )}

      {/* State Transition Buttons */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-900">Available Transitions</h3>

        {/* Transition to Review */}
        {(store.currentState as ContractState | null) === ContractState.INTENT_DECLARED && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.transitionToReview(contractId));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            → Move to Legal Review (State 1)
          </button>
        )}

        {/* Transition to Lock */}
        {store.currentState === ContractState.PRE_CONTRACT_REVIEW && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.lockContract(contractId, []));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            🔒 Lock Contract (State 2) - 48h Cooldown Starts
          </button>
        )}

        {/* Transition to Execution (with cooldown check) */}
        {store.currentState === ContractState.CONTRACT_ACTIVE_LOCKED && !store.cooldownStatus?.isActive && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.startExecution(contractId));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ▶️ Start Execution (State 3)
          </button>
        )}

        {store.currentState === ContractState.CONTRACT_ACTIVE_LOCKED && store.cooldownStatus?.isActive && (
          <button disabled className="w-full px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed">
            ⏱️ Cooldown Active ({cooldownCountdown}s remaining)
          </button>
        )}

        {/* Transition to Evaluation */}
        {store.currentState === ContractState.OPERATION_RUNNING && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.submitForEvaluation(contractId));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 Submit for Evaluation (State 4)
          </button>
        )}

        {/* Transition to Finalize */}
        {store.currentState === ContractState.EVALUATION_AND_CALCULATION && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.finalizeRights(contractId));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ✅ Finalize Rights (State 5)
          </button>
        )}

        {/* Transition to Archive */}
        {store.currentState === ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION && (
          <button
            onClick={() => {
              setNextStateAction(() => () => store.closeContract(contractId));
              setShowConfirmation(true);
            }}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            📦 Archive Contract (State 6) - FINAL
          </button>
        )}

        {/* Emergency Button (always available except when archived) */}
        {store.currentState !== ContractState.CONTRACT_CLOSED_AND_ARCHIVED && (
          <button
            onClick={() => {
              const reason = prompt('Provide reason for emergency invocation:');
              if (reason) {
                setNextStateAction(() => () => store.invokeEmergency(contractId, reason));
                setShowConfirmation(true);
              }
            }}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🚨 Invoke Emergency (State 9)
          </button>
        )}

        {store.currentState === ContractState.CONTRACT_CLOSED_AND_ARCHIVED && (
          <div className="p-4 rounded-lg bg-gray-100 text-center">
            <p className="text-gray-700 font-semibold">Contract Archived - No Further Transitions</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && nextStateAction && (
        <ConfirmationDialog
          title="Confirm Transition"
          message={`Are you sure you want to proceed with this state transition? This action may be irreversible.`}
          onConfirm={() => handleTransition(nextStateAction)}
          onCancel={() => setShowConfirmation(false)}
          isDangerous={store.currentState === ContractState.PRE_CONTRACT_REVIEW}
        />
      )}

      {/* Error Display */}
      {store.error && (
        <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
          <p className="text-red-800">{store.error}</p>
          <button
            onClick={() => store.clearError()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* State Timeline */}
      <StateTimeline transitions={store.stateContext?.transitions || []} />
    </div>
  );
};

// ============================================
// CONFIRMATION DIALOG
// ============================================

interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState(3);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg max-w-md w-full p-6 ${isDangerous ? 'border-2 border-amber-500' : ''}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-700 mb-4">{message}</p>

        {isDangerous && (
          <div className="p-3 rounded-lg bg-amber-50 border-2 border-amber-300 mb-4">
            <p className="text-sm text-amber-900 font-semibold">
              ⚠️ This action will lock the contract and start a 48-hour mandatory cooldown. After the cooldown expires, the contract becomes immutable and execution begins.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDangerous && secondsLeft > 0}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
              isDangerous
                ? secondsLeft > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isDangerous && secondsLeft > 0 ? `Confirm (${secondsLeft}s)` : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATE TIMELINE
// ============================================

interface StateTimelineProps {
  transitions: any[];
}

const StateTimeline: React.FC<StateTimelineProps> = ({ transitions }) => {
  if (!transitions || transitions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
      <h3 className="font-bold text-gray-900 mb-4">📋 State Transition History</h3>
      <div className="space-y-2">
        {transitions.map((transition, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <span className="text-gray-500 font-mono">
              {new Date(transition.createdAt).toLocaleTimeString()}
            </span>
            <span className="text-gray-700">{transition.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractStateMachine;
