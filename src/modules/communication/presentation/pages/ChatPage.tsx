import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import type { ChatAttachment, ChatPatient, PatientConnectionStatus } from "../../domain/models/PatientChat";
import { usePatientChats } from "../hooks/usePatientChats";
import styles from "./ChatPage.module.css";

interface ChatPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.8a2 2 0 0 1-.45 2.11L8.05 9.9a16 16 0 0 0 6.05 6.05l1.27-1.27a2 2 0 0 1 2.11-.45c.9.31 1.84.53 2.8.66A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 10 21 6v12l-6-4" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function AttachmentIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.4 20.4 22 12 3.4 3.6 3 10l10 2-10 2 .4 6.4Z" />
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 6-7" />
      <path d="M18 7h2v2" />
    </svg>
  );
}

function TrendSmallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 15 4-4 3 3 5-6" />
      <path d="M15 8h3v3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function statusClass(status: PatientConnectionStatus) {
  if (status === "ONLINE") return styles.statusOnline;
  if (status === "AWAY") return styles.statusAway;
  return styles.statusOffline;
}

function PatientAvatar({ patient, size = "sm" }: { patient: ChatPatient; size?: "sm" | "lg" }) {
  return (
    <span className={`${styles.avatar} ${styles[`avatar${size}`]} ${styles[`avatar${patient.avatarTone}`]}`}>
      {patient.avatarTone === "photo" ? <span className={styles.avatarFace}>{patient.initials.slice(0, 1)}</span> : patient.initials}
      <span className={`${styles.onlineDot} ${statusClass(patient.connectionStatus)}`} />
    </span>
  );
}

function AttachmentCard({ attachment }: { attachment: ChatAttachment }) {
  return (
    <span className={styles.attachmentCard}>
      <AttachmentIcon />
      <span>
        <strong>{attachment.name}</strong>
        <small>{attachment.sizeLabel}</small>
      </span>
    </span>
  );
}

export function ChatPage({ currentPath, onNavigate }: ChatPageProps) {
  const {
    chats,
    activeChat,
    activeChatId,
    draft,
    query,
    isPatientTyping,
    canCreateChat,
    isLoading,
    errorMessage,
    connectionStatus,
    setDraft,
    setQuery,
    selectChat,
    createChat,
    deleteChat,
    sendMessage,
    attachEvidence,
  } = usePatientChats();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeChat?.messages, isPatientTyping]);

  if (!activeChat) {
    return (
      <SharedLayout
        title="Communication"
        currentPath={currentPath}
        onNavigate={onNavigate}
        navigationItems={useNavigation()}
        breadcrumbs={["Communication", "Chat"]}
        showPageTitle={false}
      >
        <section className={styles.emptyState}>
          <h1>{isLoading ? "Cargando conversaciones..." : "No hay conversaciones disponibles"}</h1>
          {errorMessage && <p>{errorMessage}</p>}
        </section>
      </SharedLayout>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPatientTyping || !draft.trim() || activeChat.canChat === false) return;
    sendMessage(activeChat.id, draft);
  };

  const handleAttachEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    attachEvidence(activeChat.id, file);
    event.target.value = "";
  };

  return (
    <SharedLayout
      title="Communication"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Communication", "Chat"]}
      showPageTitle={false}
    >
      <section className={styles.chatShell} aria-label="Communication chat">
        <aside className={styles.conversationPane}>
          <div className={styles.searchBox}>
            <SearchIcon />
            <input
              type="search"
              aria-label="Search conversations"
              placeholder="Buscar pacientes..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className={styles.newChatIconButton} aria-label="Create new chat" onClick={createChat} disabled={!canCreateChat}>
              <PlusIcon />
            </button>
          </div>

          {(isLoading || errorMessage) && (
            <div className={`${styles.systemNotice} ${errorMessage ? styles.systemNoticeError : ""}`}>
              {isLoading ? "Cargando conversaciones..." : errorMessage}
            </div>
          )}

          <div className={styles.conversationList}>
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`${styles.conversationItem} ${chat.id === activeChatId ? styles.conversationActive : ""}`}
                onClick={() => {
                  selectChat(chat.id);
                  setIsActionsOpen(false);
                }}
              >
                <PatientAvatar patient={chat.patient} />
                <span className={styles.conversationCopy}>
                  <span className={styles.conversationTopline}>
                    <strong>{chat.patient.name}</strong>
                    <span>{chat.lastActivityLabel}</span>
                  </span>
                  <span className={styles.conversationPreview}>{chat.preview}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.threadPane}>
          <header className={styles.threadHeader}>
            <div className={styles.patientTitle}>
              <PatientAvatar patient={activeChat.patient} />
              <div>
                <h1>{activeChat.patient.name}</h1>
                <p className={statusClass(activeChat.patient.connectionStatus)}>{activeChat.patient.connectionLabel}</p>
              </div>
            </div>
            <div className={styles.threadActions}>
              <span className={`${styles.wsBadge} ${connectionStatus === "CONNECTED" ? styles.wsConnected : styles.wsDisconnected}`}>
                {connectionStatus === "CONNECTED" ? "WS conectado" : connectionStatus === "CONNECTING" ? "Conectando" : "WS desconectado"}
              </span>
              <button type="button" aria-label="Start voice call">
                <PhoneIcon />
              </button>
              <button type="button" aria-label="Start video call">
                <VideoIcon />
              </button>
              <div className={styles.actionsMenuWrap}>
                <button type="button" aria-label="More options" onClick={() => setIsActionsOpen((current) => !current)}>
                  <MoreIcon />
                </button>
                {isActionsOpen && (
                  <div className={styles.actionsMenu}>
                    <button type="button" onClick={() => onNavigate(activeChat.patient.recordPath)}>
                      View record
                    </button>
                    <button type="button" onClick={() => onNavigate(activeChat.patient.statsPath)}>
                      View stats
                    </button>
                    <button type="button" className={styles.deleteAction} onClick={() => deleteChat(activeChat.id)}>
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className={styles.messageThread} ref={threadRef}>
            <div className={styles.datePill}>Hoy</div>

            {activeChat.messages.map((message) => (
              <div key={message.id} className={`${styles.messageRow} ${message.author === "NUTRITIONIST" ? styles.nutritionist : styles.patient}`}>
                <div className={styles.messageBubble}>
                  {message.text}
                  {message.attachments?.map((attachment) => (
                    <AttachmentCard attachment={attachment} key={attachment.id} />
                  ))}
                </div>
                <div className={styles.messageMeta}>
                  {message.time}
                  {message.status && <span>{message.status.toLowerCase()}</span>}
                </div>
              </div>
            ))}

            {isPatientTyping && (
              <div className={`${styles.messageRow} ${styles.patient}`}>
                <div className={`${styles.messageBubble} ${styles.typingBubble}`}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <input ref={fileInputRef} className={styles.fileInput} type="file" onChange={handleAttachEvidence} />
            <button type="button" className={styles.ghostButton} aria-label="Attach evidence" onClick={() => fileInputRef.current?.click()}>
              <AttachmentIcon />
            </button>
            <label className={styles.composerField}>
              <span className={styles.srOnly}>Type your message</span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeChat.canChat === false ? "Chat no habilitado para este paciente" : "Escribe tu mensaje..."}
                disabled={isPatientTyping || activeChat.canChat === false}
              />
              <button type="button" aria-label="Add emoji">
                <SmileIcon />
              </button>
            </label>
            <button type="submit" className={styles.sendButton} aria-label="Send message" disabled={!draft.trim() || isPatientTyping || activeChat.canChat === false}>
              <SendIcon />
            </button>
          </form>
        </main>

        <aside className={styles.profilePane}>
          <section className={styles.profileSummary}>
            <PatientAvatar patient={activeChat.patient} size="lg" />
            <h2>{activeChat.patient.name}</h2>
            <span className={styles.roleBadge}>Patient</span>
          </section>

          <div className={styles.profileActions}>
            <button type="button" onClick={() => onNavigate(activeChat.patient.recordPath)}>
              <RecordsIcon />
              Records
            </button>
            <button type="button" onClick={() => onNavigate(activeChat.patient.statsPath)}>
              <StatsIcon />
              Stats
            </button>
          </div>

          <section className={styles.profileSection}>
            <h3>Current Goals</h3>
            <article className={styles.goalCard}>
              <span className={styles.goalIcon}>
                <TrendSmallIcon />
              </span>
              <div className={styles.goalCopy}>
                <strong>Weight Loss</strong>
                <p>Target: 85kg (Current: 88.2kg)</p>
                <span className={styles.progressTrack}>
                  <span className={styles.progressValue} />
                </span>
              </div>
            </article>
          </section>

          <section className={styles.profileSection}>
            <h3>Upcoming Check-ins</h3>
            <article className={styles.checkInCard}>
              <span className={styles.dateBadge}>
                <strong>Oct</strong>
                <b>24</b>
              </span>
              <div>
                <strong>Weekly Video Sync</strong>
                <p>
                  <ClockIcon />
                  10:00 AM
                </p>
              </div>
            </article>
          </section>

          <section className={styles.profileSection}>
            <div className={styles.notesHeader}>
              <h3>Recent Notes</h3>
              <button type="button" aria-label="Add note">+</button>
            </div>
            <article className={styles.noteCard}>
              <p>"Struggling with evening cravings. Suggested increasing protein intake during lunch. Review macros next week."</p>
              <span>- Oct 18, 2023</span>
            </article>
          </section>
        </aside>
      </section>
    </SharedLayout>
  );
}
