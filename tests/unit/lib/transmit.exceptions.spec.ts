import {
  FieldNameTooLargeException,
  FieldValueTooLargeException,
  FileTooLargeException,
  FileTooSmallException,
  NotEnoughFieldsException,
  NotEnoughFilesException,
  TooManyFieldsException,
  TooManyFilesException,
  TooManyPartsException,
  TransmitException,
  UnsupportedContentTypeException
} from "../../../src";

/**
 * Any subclass of Error must set its own prototype due to typescript bug, otherwise instanceof will be broken
 * https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
 */
describe("TransmitException", () => {
  it("should work with instanceof operator", () => {
    expect(new TransmitException("FIELD_NAME_TOO_LARGE")).toBeInstanceOf(Error);

    expect(new FieldNameTooLargeException()).toBeInstanceOf(FieldNameTooLargeException);
    expect(new FieldValueTooLargeException()).toBeInstanceOf(FieldValueTooLargeException);
    expect(new FileTooLargeException()).toBeInstanceOf(FileTooLargeException);
    expect(new FileTooSmallException()).toBeInstanceOf(FileTooSmallException);
    expect(new NotEnoughFieldsException()).toBeInstanceOf(NotEnoughFieldsException);
    expect(new NotEnoughFilesException()).toBeInstanceOf(NotEnoughFilesException);
    expect(new TooManyFieldsException()).toBeInstanceOf(TooManyFieldsException);
    expect(new TooManyFilesException()).toBeInstanceOf(TooManyFilesException);
    expect(new TooManyPartsException()).toBeInstanceOf(TooManyPartsException);
    expect(new UnsupportedContentTypeException()).toBeInstanceOf(UnsupportedContentTypeException);

    expect(new FieldNameTooLargeException()).toBeInstanceOf(TransmitException);
    expect(new FieldValueTooLargeException()).toBeInstanceOf(TransmitException);
    expect(new FileTooLargeException()).toBeInstanceOf(TransmitException);
    expect(new FileTooSmallException()).toBeInstanceOf(TransmitException);
    expect(new NotEnoughFieldsException()).toBeInstanceOf(TransmitException);
    expect(new NotEnoughFilesException()).toBeInstanceOf(TransmitException);
    expect(new TooManyFieldsException()).toBeInstanceOf(TransmitException);
    expect(new TooManyFilesException()).toBeInstanceOf(TransmitException);
    expect(new TooManyPartsException()).toBeInstanceOf(TransmitException);
    expect(new UnsupportedContentTypeException()).toBeInstanceOf(TransmitException);

    expect(new FieldNameTooLargeException()).toBeInstanceOf(Error);
    expect(new FieldValueTooLargeException()).toBeInstanceOf(Error);
    expect(new FileTooLargeException()).toBeInstanceOf(Error);
    expect(new FileTooSmallException()).toBeInstanceOf(Error);
    expect(new NotEnoughFieldsException()).toBeInstanceOf(Error);
    expect(new NotEnoughFilesException()).toBeInstanceOf(Error);
    expect(new TooManyFieldsException()).toBeInstanceOf(Error);
    expect(new TooManyFilesException()).toBeInstanceOf(Error);
    expect(new TooManyPartsException()).toBeInstanceOf(Error);
    expect(new UnsupportedContentTypeException()).toBeInstanceOf(Error);
  });
});
