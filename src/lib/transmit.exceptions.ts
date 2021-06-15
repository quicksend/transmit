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

export class TransmitException extends Error {
  readonly isTransmitError = true;

  constructor(readonly code: keyof typeof TransmitErrorCodes) {
    super(TransmitErrorCodes[code]);
  }
}

export class FieldNameTooLargeException extends TransmitException {
  constructor() {
    super("FIELD_NAME_TOO_LARGE");
  }
}

export class FieldValueTooLargeException extends TransmitException {
  constructor() {
    super("FIELD_VALUE_TOO_LARGE");
  }
}

export class FileTooLargeException extends TransmitException {
  constructor() {
    super("FILE_TOO_LARGE");
  }
}

export class FileTooSmallException extends TransmitException {
  constructor() {
    super("FILE_TOO_SMALL");
  }
}

export class NotEnoughFieldsException extends TransmitException {
  constructor() {
    super("NOT_ENOUGH_FIELDS");
  }
}

export class NotEnoughFilesException extends TransmitException {
  constructor() {
    super("NOT_ENOUGH_FILES");
  }
}

export class TooManyFieldsException extends TransmitException {
  constructor() {
    super("TOO_MANY_FIELDS");
  }
}

export class TooManyFilesException extends TransmitException {
  constructor() {
    super("TOO_MANY_FILES");
  }
}

export class TooManyPartsException extends TransmitException {
  constructor() {
    super("TOO_MANY_PARTS");
  }
}

export class UnsupportedContentTypeException extends TransmitException {
  constructor() {
    super("UNSUPPORTED_CONTENT_TYPE");
  }
}
