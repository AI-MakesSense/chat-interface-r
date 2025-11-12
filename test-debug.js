import { FileUpload } from './widget/src/ui/file-upload.ts';
import { StateManager } from './widget/src/core/state.ts';

const config = {
  branding: { companyName: 'Test', logoUrl: '', welcomeText: 'Hi', firstMessage: 'Hello' },
  style: { theme: 'light', primaryColor: '#00bfff', backgroundColor: '#fff', textColor: '#000', position: 'bottom-right', cornerRadius: 8, fontFamily: 'Arial', fontSize: 14 },
  features: { fileAttachmentsEnabled: true, allowedExtensions: ['.jpg', '.pdf'], maxFileSizeKB: 5120 },
  connection: { webhookUrl: 'https://example.com/webhook' }
};

const state = { isOpen: true, messages: [], isLoading: false, error: null, currentStreamingMessage: null, currentTheme: 'light' };
const stateManager = new StateManager(state);
const fileUpload = new FileUpload(config, stateManager);
const element = fileUpload.render();

const fileInput = element.querySelector('input[type="file"]');
const mockFile = new File(['x'.repeat(1024)], 'test.exe', { type: 'application/x-msdownload' });

Object.defineProperty(fileInput, 'files', { value: [mockFile], writable: false });
fileInput.dispatchEvent(new Event('change', { bubbles: true }));

console.log('Element text content:', element.textContent);
console.log('Error container:', element.querySelector('.cw-error'));
console.log('Error container text:', element.querySelector('.cw-error')?.textContent);
console.log('Error container display:', element.querySelector('.cw-error')?.style.display);
