/**
 * File Upload Component
 *
 * Purpose: Handles file attachment selection and validation
 * Responsibility: File picker UI, file validation, and state management
 * Assumptions: Config contains valid file upload settings
 */

import { WidgetConfig } from '../types';
import { StateManager } from '../core/state';

/**
 * Validates if a file extension is allowed
 * @param filename - Name of the file
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.pdf'])
 * @returns True if extension is allowed
 */
function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const parts = filename.toLowerCase().split('.');
  if (parts.length < 2) return false;

  // Normalize allowed extensions to lowercase
  const normalizedExtensions = allowedExtensions.map(ext => ext.toLowerCase());

  // Check single extension (.jpg)
  const ext = '.' + parts[parts.length - 1];
  if (normalizedExtensions.includes(ext)) {
    return true;
  }

  // Check double extension (.tar.gz)
  if (parts.length >= 3) {
    const doubleExt = '.' + parts[parts.length - 2] + '.' + parts[parts.length - 1];
    if (normalizedExtensions.includes(doubleExt)) {
      return true;
    }
  }

  return false;
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "512 KB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File Upload Component
 * Provides UI for selecting and validating file attachments
 */
export class FileUpload {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private unsubscribe?: () => void;
  private element?: HTMLElement;
  private fileInput?: HTMLInputElement;
  private uploadButton?: HTMLButtonElement;
  private fileInfoContainer?: HTMLElement;
  private errorContainer?: HTMLElement;
  private currentFile: File | null = null;

  // Event handler references for cleanup
  private buttonClickHandler?: () => void;
  private fileChangeHandler?: (e: Event) => void;
  private removeFileHandler?: () => void;

  /**
   * Creates a new FileUpload instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
   */
  constructor(config: WidgetConfig, stateManager: StateManager) {
    if (!config) {
      throw new Error('Config is required');
    }
    if (!stateManager) {
      throw new Error('StateManager is required');
    }

    this.config = config;
    this.stateManager = stateManager;
  }

  /**
   * Renders the file upload component
   * @returns HTMLElement containing the file upload UI
   */
  render(): HTMLElement {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = `cw-file-upload cw-theme-${this.config.style.theme}`;

    // Create hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.style.display = 'none';

    // Create upload button
    this.uploadButton = document.createElement('button');
    this.uploadButton.type = 'button';
    this.uploadButton.className = 'cw-file-upload-button';
    this.uploadButton.setAttribute('aria-label', 'attach file');
    this.uploadButton.textContent = '📎 Attach';
    this.uploadButton.style.cursor = 'pointer';

    // Create error container (hidden initially, shown when error occurs)
    this.errorContainer = document.createElement('div');
    this.errorContainer.className = 'cw-error cw-file-error';
    this.errorContainer.style.color = 'rgb(255, 0, 0)';
    this.errorContainer.style.display = 'none';

    // Don't create file info container yet - will be created when needed

    // Attach event listeners
    this.buttonClickHandler = () => {
      this.fileInput?.click();
    };
    this.uploadButton.addEventListener('click', this.buttonClickHandler);

    this.fileChangeHandler = (e: Event) => {
      this.handleFileChange(e);
    };
    this.fileInput.addEventListener('change', this.fileChangeHandler);

    // Append elements
    this.element.appendChild(this.fileInput);
    this.element.appendChild(this.uploadButton);
    this.element.appendChild(this.errorContainer);

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((state) => {
      this.handleStateChange(state);
    });

    // Apply initial state
    const initialState = this.stateManager.getState();
    this.handleStateChange(initialState);

    return this.element;
  }

  /**
   * Handles file input change event
   * @param e - Change event
   */
  private handleFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = input.files;

    // Handle null, undefined, or empty files
    if (!files || files.length === 0) {
      this.clearFile();
      return;
    }

    const file = files[0];

    // Validate file extension
    const allowedExtensions = this.config.features.allowedExtensions || [];
    if (allowedExtensions.length > 0 && !validateExtension(file.name, allowedExtensions)) {
      this.clearFileInput();
      this.showError('File type not allowed. Please select a valid file.');
      return;
    }

    // Validate file size (config is in KB, file.size is in bytes)
    const maxSizeBytes = (this.config.features.maxFileSizeKB || 0) * 1024;
    if (maxSizeBytes > 0 && file.size > maxSizeBytes) {
      this.clearFileInput();
      this.showError(`File too large. Maximum size is ${formatFileSize(maxSizeBytes)}.`);
      return;
    }

    // File is valid, update state
    this.currentFile = file;
    this.showFileInfo(file);
    this.hideError();
    this.stateManager.setState({ attachedFile: file });
  }

  /**
   * Displays file information
   * @param file - Selected file
   */
  private showFileInfo(file: File): void {
    if (!this.element) return;

    // Create file info container if it doesn't exist
    if (!this.fileInfoContainer) {
      this.fileInfoContainer = document.createElement('div');
      this.fileInfoContainer.className = 'cw-file-info';
      this.element.appendChild(this.fileInfoContainer);
    }

    // Create file info display
    const fileName = document.createElement('span');
    fileName.textContent = file.name;

    const fileSize = document.createElement('span');
    fileSize.textContent = ` (${formatFileSize(file.size)})`;

    // Create remove button
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'cw-remove-file';
    removeButton.setAttribute('aria-label', 'Remove file');
    removeButton.textContent = '×';
    removeButton.style.cursor = 'pointer';
    removeButton.style.marginLeft = '8px';

    this.removeFileHandler = () => {
      this.clearFile();
      this.stateManager.setState({ attachedFile: null });
    };
    removeButton.addEventListener('click', this.removeFileHandler);

    // Clear and update file info container
    this.fileInfoContainer.innerHTML = '';
    this.fileInfoContainer.appendChild(fileName);
    this.fileInfoContainer.appendChild(fileSize);
    this.fileInfoContainer.appendChild(removeButton);
  }

  /**
   * Shows error message
   * @param message - Error message to display
   */
  private showError(message: string): void {
    if (!this.errorContainer) return;

    this.errorContainer.textContent = message;
    this.errorContainer.style.display = 'block';
  }

  /**
   * Hides error message
   */
  private hideError(): void {
    if (this.errorContainer) {
      this.errorContainer.textContent = '';
      this.errorContainer.style.display = 'none';
    }
  }

  /**
   * Clears only the file input value
   */
  private clearFileInput(): void {
    this.currentFile = null;

    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  /**
   * Clears selected file and hides error
   */
  private clearFile(): void {
    this.clearFileInput();

    if (this.fileInfoContainer && this.element) {
      this.element.removeChild(this.fileInfoContainer);
      this.fileInfoContainer = undefined;
    }

    this.hideError();
  }

  /**
   * Handles state changes from StateManager
   * @param state - New widget state
   */
  private handleStateChange(state: any): void {
    // Disable/enable button based on loading state
    if (this.uploadButton) {
      if (state.isLoading) {
        this.uploadButton.setAttribute('disabled', 'true');
      } else {
        this.uploadButton.removeAttribute('disabled');
      }
    }

    // Show file info if attachedFile is set in state
    if (state.attachedFile && state.attachedFile !== this.currentFile) {
      this.currentFile = state.attachedFile;
      this.showFileInfo(state.attachedFile);
      this.hideError();
    } else if (!state.attachedFile && this.currentFile) {
      // Clear file info if attachedFile is removed from state
      this.clearFile();
    }
  }

  /**
   * Cleans up event listeners and subscriptions
   */
  destroy(): void {
    // Unsubscribe from state changes
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }

    // Remove event listeners
    if (this.uploadButton && this.buttonClickHandler) {
      this.uploadButton.removeEventListener('click', this.buttonClickHandler);
    }

    if (this.fileInput && this.fileChangeHandler) {
      this.fileInput.removeEventListener('change', this.fileChangeHandler);
    }

    // Remove file button listeners
    const removeButton = this.element?.querySelector('.cw-remove-file');
    if (removeButton && this.removeFileHandler) {
      removeButton.removeEventListener('click', this.removeFileHandler);
    }

    // Clear references
    this.buttonClickHandler = undefined;
    this.fileChangeHandler = undefined;
    this.removeFileHandler = undefined;
  }
}
