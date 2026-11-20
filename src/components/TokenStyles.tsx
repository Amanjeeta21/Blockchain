
export default function TokenStyles() {
  return (
    <style jsx global>{`
      .send-tokens {
        width: 100%;
        max-width: 1050px;
        margin: 18px auto;
        padding: 28px;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
        color: var(--foreground);
      }

      .send-tokens-heading {
        margin-bottom: 22px;
      }

      .send-tokens-eyebrow {
        margin: 0 0 7px;
        color: var(--muted);
        font-family: "DM Mono", monospace;
        font-size: 9px;
        letter-spacing: 2px;
      }

      .send-tokens-heading h2 {
        margin: 0;
        color: var(--foreground);
        font-size: 19px;
        font-weight: 800;
      }

      .send-tokens-heading > p:last-child {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.7;
      }

      .send-tokens-notice,
      .send-tokens-error {
        margin: 14px 0;
        padding: 12px 14px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--surface-raised);
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-warning {
        border-color: var(--warning);
        background: var(--surface-soft);
        color: var(--foreground);
      }

      .send-tokens-error {
        border-color: var(--danger);
        background: var(--surface-raised);
        color: var(--danger);
      }

      .send-tokens-form {
        display: grid;
        gap: 17px;
      }

      .send-tokens-field {
        display: grid;
        gap: 8px;
      }

      .send-tokens-field label {
        color: var(--muted);
        font-family: "DM Mono", monospace;
        font-size: 9px;
        letter-spacing: 1.3px;
      }

      .send-tokens-field input {
        width: 100%;
        min-width: 0;
        padding: 13px 14px;
        border: 1px solid var(--border);
        border-radius: 7px;
        outline: none;
        background: var(--background);
        color: var(--foreground);
        font-family: "DM Mono", monospace;
        font-size: 12px;
        transition: border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .send-tokens-field input::placeholder {
        color: var(--muted-dark);
      }

      .send-tokens-field input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--focus-ring);
      }

      .send-tokens-amount {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-right: 14px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--background);
      }

      .send-tokens-amount:focus-within {
        border-color: var(--accent);
      }

      .send-tokens-amount input {
        border: 0;
        background: transparent;
      }

      .send-tokens-amount input:focus {
        box-shadow: none;
      }

      .send-tokens-amount span {
        flex-shrink: 0;
        color: var(--accent);
        font-family: "DM Mono", monospace;
        font-size: 10px;
      }

      .send-tokens-validation {
        margin: 0;
        color: var(--danger);
        font-size: 11px;
      }

      .send-tokens-submit {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        min-height: 45px;
        padding: 12px 16px;
        border: 1px solid var(--accent);
        border-radius: 7px;
        background: var(--accent);
        color: var(--background);
        font-family: "DM Mono", monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        transition: background 0.2s ease,
          transform 0.2s ease;
      }

      .send-tokens-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        background: var(--accent-hover);
        border-color: var(--accent-hover);
      }

      .send-tokens-submit:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .send-tokens-status {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-status p {
        margin: 13px 0 0;
      }

      .send-tokens-status a {
        color: var(--accent);
        font-weight: 600;
      }

      .send-tokens-success {
        color: var(--success);
      }

      .send-tokens-divider {
        height: 1px;
        margin: 30px 0;
        background: var(--border);
      }

      .send-tokens-allowance {
        margin-top: 24px;
        padding: 19px;
        border: 1px solid var(--border);
        border-radius: 9px;
        background: var(--surface-raised);
      }

      .send-tokens-allowance-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .send-tokens-allowance-heading h3 {
        margin: 0;
        color: var(--foreground);
        font-size: 13px;
        font-weight: 800;
      }

      .send-tokens-refresh {
        width: 34px;
        height: 34px;
        border: 1px solid var(--border-strong);
        border-radius: 50%;
        background: var(--surface-soft);
        color: var(--accent);
        font-size: 21px;
        cursor: pointer;
        transition: background 0.2s ease,
          transform 0.2s ease;
      }

      .send-tokens-refresh:hover:not(:disabled) {
        background: var(--surface);
        transform: rotate(45deg);
      }

      .send-tokens-refresh:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .send-tokens-allowance-value {
        margin: 17px 0 0;
        color: var(--foreground);
        font-size: clamp(23px, 4vw, 30px);
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .send-tokens-allowance-value span {
        color: var(--muted);
        font-size: 13px;
      }

      .send-tokens-allowance > p:not(
          .send-tokens-allowance-value
        ) {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-hint {
        margin-bottom: 0;
      }

      .send-tokens-info {
        margin: 16px 0;
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--surface-raised);
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-info strong {
        color: var(--foreground);
      }

      .send-tokens-info p {
        margin: 5px 0 0;
      }

      .send-tokens-security {
        margin-top: 16px;
        padding: 14px 16px;
        border: 1px solid var(--warning);
        border-radius: 7px;
        background: var(--surface-soft);
        color: var(--foreground);
        font-size: 12px;
        line-height: 1.6;
      }

      .send-tokens-security p {
        margin: 5px 0 0;
      }

      @media (max-width: 650px) {
        .send-tokens {
          padding: 22px 18px;
        }
      }
    `}</style>
  );
}
