/**
 * State Manager
 *
 * Purpose: Manages widget's internal state with subscription-based updates
 * Responsibility: State storage, updates, and listener notifications
 * Assumptions: State follows WidgetState interface
 */

/**
 * Message interface for chat messages
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Widget state interface
 */
export interface WidgetState {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStreamingMessage: string | null;
  currentTheme?: 'light' | 'dark';
  attachedFile?: File | null;
}

/**
 * State Manager class for managing widget state
 */
export class StateManager {
  private state: WidgetState;
  private listeners: Set<(state: WidgetState) => void>;

  /**
   * Creates a new StateManager instance
   * @param initialState - Initial state for the widget
   */
  constructor(initialState: WidgetState) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  /**
   * Gets the current state
   * @returns Copy of current state
   */
  getState(): WidgetState {
    return { ...this.state };
  }

  /**
   * Updates the state with partial changes
   * @param partial - Partial state to merge with current state
   */
  setState(partial: Partial<WidgetState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Subscribes a listener to state changes
   * @param listener - Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: WidgetState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifies all listeners of state changes
   */
  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      listener(currentState);
    });
  }
}