import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock WebSocket if not available
if (typeof WebSocket === 'undefined') {
  global.WebSocket = class WebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = WebSocket.CONNECTING;
    
    constructor(public url: string) {}
    
    close() {}
    send(data: any) {}
    addEventListener(event: string, handler: any) {}
    removeEventListener(event: string, handler: any) {}
  } as any;
}
