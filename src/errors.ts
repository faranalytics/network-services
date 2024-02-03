export class CallTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CallTimeoutError";
  }
}

export class StreamClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StreamClosedError";
  }
}

export class PropertyPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropertyPathError";
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class InstantiationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InstantiationError";
  }
}

export class QueueSizeLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueSizeLimitError";
  }
}
