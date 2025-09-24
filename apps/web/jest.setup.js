// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Load environment variables for testing
require('dotenv').config({ path: '.env.local' });

// Node.js globals for compatibility with modern dependencies
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch polyfill for Node.js environment
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Add fail function for Jest compatibility
global.fail = reason => {
  throw new Error(reason);
};

// Enhanced Headers class with full Web API compatibility
global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      if (init instanceof Headers) {
        for (const [key, value] of init.entries()) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.headers.set(key.toLowerCase(), value);
        }
      }
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase());
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name) {
    return this.headers.delete(name.toLowerCase());
  }

  entries() {
    return this.headers.entries();
  }

  keys() {
    return this.headers.keys();
  }

  values() {
    return this.headers.values();
  }

  forEach(callback, thisArg) {
    this.headers.forEach(callback, thisArg);
  }
};

// Enhanced Request class for Next.js API route testing
global.Request = class Request {
  constructor(input, init) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this._body = init?.body;
  }

  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }

  async text() {
    return typeof this._body === 'string'
      ? this._body
      : JSON.stringify(this._body);
  }
};

// Enhanced Response class with NextResponse compatibility
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  static json(data, init) {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');

    return new Response(body, {
      ...init,
      headers,
    });
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async text() {
    return typeof this.body === 'string'
      ? this.body
      : JSON.stringify(this.body);
  }
};

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
