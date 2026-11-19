"use client";

export default function TokenStyles() {
  return (
    <style jsx global>{`
      .send-tokens {
        width: 100%;
        max-width: 1050px;
        margin: 18px auto;
        padding: 28px;
        border: 1px solid #e4e2e8;
        border-radius: 14px;
        background: #fff;
      }

      .send-tokens-heading {
        margin-bottom: 22px;
      }

      .send-tokens-eyebrow {
        margin: 0 0 7px;
        color: #70569d;
        font-family: "DM Mono", monospace;
        font-size: 9px;
        letter-spacing: 2px;
      }

      .send-tokens-heading h2 {
        margin: 0;
        color: #202024;
        font-size: 19px;
        font-weight: 800;
      }

      .send-tokens-heading > p:last-child {
        margin: 8px 0 0;
        color: #777780;
        font-size: 12px;
        line-height: 1.6;
      }

      .send-tokens-notice,
      .send-tokens-error {
        margin: 14px 0;
        padding: 12px 14px;
        border-radius: 8px;
        background: #f5f4f7;
        color: #55535d;
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-warning {
        background: #f7f2ec;
        color: #855b2f;
      }

      .send-tokens-error {
        background: #fbf0f0;
        color: #9c3e3e;
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
        color: #686570;
        font-family: "DM Mono", monospace;
        font-size: 9px;
        letter-spacing: 1.3px;
      }

      .send-tokens-field input {
        width: 100%;
        min-width: 0;
        padding: 13px 14px;
        border: 1px solid #dedce3;
        border-radius: 8px;
        outline: none;
        background: #fbfafc;
        color: #29272f;
        font-family: "DM Mono", monospace;
        font-size: 12px;
      }

      .send-tokens-field input:focus {
        border-color: #8b75b3;
        box-shadow: 0 0 0 3px
          rgba(112, 86, 157, 0.12);
      }

      .send-tokens-amount {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-right: 14px;
        border: 1px solid #dedce3;
        border-radius: 8px;
        background: #fbfafc;
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
        color: #70569d;
        font-family: "DM Mono", monospace;
        font-size: 10px;
      }

      .send-tokens-validation {
        margin: 0;
        color: #9c3e3e;
        font-size: 11px;
      }

      .send-tokens-submit {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        min-height: 45px;
        padding: 12px 16px;
        border: 1px solid #70569d;
        border-radius: 8px;
        background: #70569d;
        color: #fff;
        font-family: "DM Mono", monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 1px;
        transition:
          background 0.2s ease,
          transform 0.2s ease;
      }

      .send-tokens-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        background: #59427f;
      }

      .send-tokens-submit:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .send-tokens-status {
        color: #55535d;
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-status p {
        margin: 13px 0 0;
      }

      .send-tokens-status a {
        color: #70569d;
        font-weight: 600;
      }

      .send-tokens-success {
        color: #477153;
      }

      .send-tokens-divider {
        height: 1px;
        margin: 30px 0;
        background: #e9e6ed;
      }

      .send-tokens-allowance {
        margin-top: 24px;
        padding: 19px;
        border: 1px solid #e4e2e8;
        border-radius: 10px;
        background: #fbfafc;
      }

      .send-tokens-allowance-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .send-tokens-allowance-heading h3 {
        margin: 0;
        color: #202024;
        font-size: 13px;
        font-weight: 800;
      }

      .send-tokens-refresh {
        width: 34px;
        height: 34px;
        border: 1px solid #dedce3;
        border-radius: 50%;
        background: #fff;
        color: #70569d;
        font-size: 21px;
        cursor: pointer;
      }

      .send-tokens-refresh:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .send-tokens-allowance-value {
        margin: 17px 0 0;
        color: #29272f;
        font-size: clamp(23px, 4vw, 30px);
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .send-tokens-allowance-value span {
        color: #70569d;
        font-size: 13px;
      }

      .send-tokens-allowance > p:not(
          .send-tokens-allowance-value
        ) {
        color: #686570;
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
        border-radius: 8px;
        background: #f5f4f7;
        color: #55535d;
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;
      }

      .send-tokens-info strong {
        color: #29272f;
      }

      .send-tokens-info p {
        margin: 5px 0 0;
      }

      .send-tokens-security {
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 8px;
        background: #f7f2ec;
        color: #855b2f;
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