// Script fonts draw "&" as an ambiguous flourish, so ampersands are set in the italic serif.
export function withAmp(text) {
  const parts = text.split('&');
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <span key={i} className="amp">
            &amp;
          </span>,
          part,
        ],
  );
}
