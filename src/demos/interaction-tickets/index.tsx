import { ApprovalTicket, AskUserTicket } from "./InteractionTickets";

export default function InteractionTicketsDemo() {
  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_32%)] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-10 pb-12">
        <header className="max-w-[620px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Human in the loop · ticket study
          </p>
          <h1 className="mt-3 font-runde text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">
            Two requests, two distinct tickets.
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-muted-foreground">
            Approval behaves like a security permit. AskUser behaves like a compact questionnaire stub. Both resolve into receipts without losing their original shell.
          </p>
        </header>

        <section aria-labelledby="approval-ticket-heading">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">01 · authority</p>
              <h2 id="approval-ticket-heading" className="mt-1 font-runde text-sm font-semibold text-foreground">
                Approval Ticket
              </h2>
            </div>
            <p className="hidden text-[11px] text-muted-foreground sm:block">Permit · scope · execution</p>
          </div>
          <ApprovalTicket />
        </section>

        <section aria-labelledby="ask-user-ticket-heading">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">02 · intent</p>
              <h2 id="ask-user-ticket-heading" className="mt-1 font-runde text-sm font-semibold text-foreground">
                AskUser Ticket
              </h2>
            </div>
            <p className="hidden text-[11px] text-muted-foreground sm:block">Question · choice · reply</p>
          </div>
          <AskUserTicket />
        </section>
      </div>
    </div>
  );
}
