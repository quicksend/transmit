export enum TransmitErrorCodes {
  FIELD_NAME_TOO_LARGE = "Field name too large.",
  FIELD_VALUE_TOO_LARGE = "Field value too large",
  FILE_TOO_LARGE = "File too large.",
  FILE_TOO_SMALL = "File too small.",
  NOT_ENOUGH_FIELDS = "Not enough fields.",
  NOT_ENOUGH_FILES = "Not enough files.",
  TOO_MANY_FIELDS = "Too many fields.",
  TOO_MANY_FILES = "Too many files.",
  TOO_MANY_PARTS = "Too many parts.",
  UNSUPPORTED_CONTENT_TYPE = "Unsupported content type."
}

/**
 * Any subclass of Error must set its own prototype due to a TypeScript bug, otherwise instanceof will be broken
 * https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
 * https://github.com/Microsoft/TypeScript/issues/13965
 */

export class TransmitException extends Error {
  readonly isTransmitError = true;

  constructor(readonly code: keyof typeof TransmitErrorCodes) {
    super(TransmitErrorCodes[code]);
    Object.setPrototypeOf(this, TransmitException.prototype);
  }
}

export class FieldNameTooLargeException extends TransmitException {
  constructor() {
    super("FIELD_NAME_TOO_LARGE");
    Object.setPrototypeOf(this, FieldNameTooLargeException.prototype);
  }
}

export class FieldValueTooLargeException extends TransmitException {
  constructor() {
    super("FIELD_VALUE_TOO_LARGE");
    Object.setPrototypeOf(this, FieldValueTooLargeException.prototype);
  }
}

export class FileTooLargeException extends TransmitException {
  constructor() {
    super("FILE_TOO_LARGE");
    Object.setPrototypeOf(this, FileTooLargeException.prototype);
  }
}

export class FileTooSmallException extends TransmitException {
  constructor() {
    super("FILE_TOO_SMALL");
    Object.setPrototypeOf(this, FileTooSmallException.prototype);
  }
}

export class NotEnoughFieldsException extends TransmitException {
  constructor() {
    super("NOT_ENOUGH_FIELDS");
    Object.setPrototypeOf(this, NotEnoughFieldsException.prototype);
  }
}

export class NotEnoughFilesException extends TransmitException {
  constructor() {
    super("NOT_ENOUGH_FILES");
    Object.setPrototypeOf(this, NotEnoughFilesException.prototype);
  }
}

export class TooManyFieldsException extends TransmitException {
  constructor() {
    super("TOO_MANY_FIELDS");
    Object.setPrototypeOf(this, TooManyFieldsException.prototype);
  }
}

export class TooManyFilesException extends TransmitException {
  constructor() {
    super("TOO_MANY_FILES");
    Object.setPrototypeOf(this, TooManyFilesException.prototype);
  }
}

export class TooManyPartsException extends TransmitException {
  constructor() {
    super("TOO_MANY_PARTS");
    Object.setPrototypeOf(this, TooManyPartsException.prototype);
  }
}

export class UnsupportedContentTypeException extends TransmitException {
  constructor() {
    super("UNSUPPORTED_CONTENT_TYPE");
    Object.setPrototypeOf(this, UnsupportedContentTypeException.prototype);
  }
}
