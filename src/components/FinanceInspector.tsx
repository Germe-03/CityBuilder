import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Coins,
  Percent,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

import {
  getDebtSummary,
  getLoanAnnualRate,
  getLoanMonthlyPayment,
  LOAN_AMOUNTS,
  LOAN_TERMS,
  MAX_ACTIVE_LOANS,
  type GameState,
  type LoanAmount,
  type LoanTerm,
} from "../simulation/cityMap";

interface FinanceInspectorProps {
  state: GameState;
  onTakeLoan: (amount: LoanAmount, term: LoanTerm) => void;
}

const currency = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

export function FinanceInspector({ state, onTakeLoan }: FinanceInspectorProps) {
  const [amount, setAmount] = useState<LoanAmount>(25_000);
  const [term, setTerm] = useState<LoanTerm>(24);
  const summary = getDebtSummary(state);
  const annualRate = getLoanAnnualRate(amount, term);
  const monthlyPayment = getLoanMonthlyPayment(amount, term);
  const totalRepayment = monthlyPayment * term;
  const atLimit = summary.activeLoanCount >= MAX_ACTIVE_LOANS;

  return (
    <aside className="sector-inspector finance-inspector" aria-label="Finanzen">
      <div className="inspector-heading">
        <span className="inspector-icon">
          <WalletCards aria-hidden="true" />
        </span>
        <div>
          <small>Stadtfinanzen</small>
          <h2>Finanzen</h2>
        </div>
        <span
          className={`sector-status ${summary.activeLoanCount > 0 ? "status-available" : "status-owned"}`}
        >
          {summary.activeLoanCount} / {MAX_ACTIVE_LOANS} Kredite
        </span>
      </div>

      <dl className="sector-details finance-details">
        <div>
          <dt>
            <Coins aria-hidden="true" />
            Restschuld
          </dt>
          <dd>{currency.format(summary.totalRemainingBalance)}</dd>
        </div>
        <div>
          <dt>
            <CalendarDays aria-hidden="true" />
            Monatsraten
          </dt>
          <dd>{currency.format(summary.monthlyPayment)}</dd>
        </div>
      </dl>

      <section className="finance-section" aria-labelledby="loan-amount-heading">
        <h3 id="loan-amount-heading">Kredithoehe</h3>
        <div className="loan-options loan-amount-options" role="group">
          {LOAN_AMOUNTS.map((option) => (
            <button
              key={option}
              type="button"
              className={amount === option ? "is-selected" : ""}
              onClick={() => setAmount(option)}
              aria-pressed={amount === option}
            >
              {currency.format(option)}
            </button>
          ))}
        </div>
      </section>

      <section className="finance-section" aria-labelledby="loan-term-heading">
        <h3 id="loan-term-heading">Laufzeit</h3>
        <div className="loan-options loan-term-options" role="group">
          {LOAN_TERMS.map((option) => (
            <button
              key={option}
              type="button"
              className={term === option ? "is-selected" : ""}
              onClick={() => setTerm(option)}
              aria-pressed={term === option}
            >
              {option} Monate
            </button>
          ))}
        </div>
      </section>

      <dl className="loan-offer" aria-label="Kreditangebot">
        <div>
          <dt>
            <Percent aria-hidden="true" />
            Jahreszins
          </dt>
          <dd>{annualRate.toFixed(1)} %</dd>
        </div>
        <div>
          <dt>
            <CalendarDays aria-hidden="true" />
            Monatsrate
          </dt>
          <dd>{currency.format(monthlyPayment)}</dd>
        </div>
        <div>
          <dt>
            <CircleDollarSign aria-hidden="true" />
            Rueckzahlung
          </dt>
          <dd>{currency.format(totalRepayment)}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="primary-button take-loan-button"
        onClick={() => onTakeLoan(amount, term)}
        disabled={atLimit}
      >
        <Banknote aria-hidden="true" />
        Kredit aufnehmen
      </button>

      <section className="finance-section active-loans" aria-labelledby="loans-heading">
        <h3 id="loans-heading">Laufende Kredite</h3>
        {state.loans.length === 0 ? (
          <p className="finance-empty">Keine laufenden Kredite</p>
        ) : (
          state.loans.map((loan) => (
            <article className="loan-row" key={loan.id}>
              <div>
                <strong>{currency.format(loan.remainingBalance)}</strong>
                <small>{loan.remainingMonths} Monate verbleibend</small>
              </div>
              <div>
                <strong>{currency.format(loan.monthlyPayment)} / Mt.</strong>
                <small>{loan.annualRate.toFixed(1)} % Zins</small>
              </div>
            </article>
          ))
        )}
      </section>
    </aside>
  );
}
