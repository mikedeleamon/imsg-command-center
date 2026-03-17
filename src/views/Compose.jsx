import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { freqLabel, colorForName, initials } from '../utils/helpers';

function todayPlus1h() {
    const n = new Date();
    n.setHours(n.getHours() + 1, 0, 0, 0);
    return {
        date: n.toISOString().split('T')[0],
        time: n.toTimeString().slice(0, 5),
    };
}

const digits = (s) => String(s ?? '').replace(/\D/g, '');

// Returns the matching contact if the handle (not name) is stored
function matchContact(contacts, handle) {
    if (!handle) return null;
    return (
        contacts.find(
            (c) =>
                c.handle === handle ||
                (digits(c.handle).length >= 7 &&
                    digits(c.handle) === digits(handle)),
        ) ?? null
    );
}

// Validate a recipient value — returns null if valid, error string if not
function validateRecipient(value, contacts) {
    const v = value.trim();
    if (!v) return 'Enter a recipient.';
    // 1. Known contact handle or digit-normalised phone match
    if (matchContact(contacts, v)) return null;
    // 2. Any phone number with 10+ digits — valid regardless of contact match
    if (digits(v).length >= 10) return null;
    // 3. Valid email address (Apple ID for iMessage)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    return 'Enter a valid phone number, Apple ID email, or select a contact.';
}

// ── Contact search input with dropdown ───────────────────────────────────────
// Design rules:
//  - `inputText`  : local — only updated while the field is open
//  - `value`      : parent — the committed handle; NEVER written mid-type
//  - Filtering is driven solely by inputText; parent onChange only fires on commit
function ContactSearchInput({
    contacts,
    value,
    onChange,
    onBlurValidate,
    error,
}) {
    const [inputText, setInputText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef();

    // Resolve committed handle → contact (chip display only)
    const matched = matchContact(contacts, value);

    // ── Live filter: runs on every inputText change ────────────────────────
    const q = inputText.toLowerCase().trim();
    const dq = digits(q);
    const filteredContacts =
        q.length > 0
            ? contacts.filter(
                  (c) =>
                      c.name.toLowerCase().includes(q) ||
                      c.handle.toLowerCase().includes(q) ||
                      (dq.length > 0 &&
                          digits(c.handle).length >= 7 &&
                          digits(c.handle).includes(dq)),
              )
            : contacts;

    // ── Commit: fires only on blur / Enter / select ────────────────────────
    const commit = (text) => {
        const trimmed = (text ?? inputText).trim();
        if (trimmed) {
            const nameMatch = contacts.find(
                (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
            );
            const committed = nameMatch ? nameMatch.handle : trimmed;
            onChange(committed);
            onBlurValidate?.(committed);
        } else {
            onBlurValidate?.(value);
        }
        setInputText('');
        setIsOpen(false);
    };

    const select = (contact) => {
        // e.preventDefault() on onMouseDown prevents blur firing before select
        onChange(contact.handle);
        onBlurValidate?.(contact.handle);
        setInputText('');
        setIsOpen(false);
    };

    const openEditor = () => {
        setInputText(matched ? matched.name : value || '');
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const clear = (e) => {
        e.stopPropagation();
        onChange('');
        setInputText('');
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const borderColor = error
        ? 'rgba(255,69,58,0.6)'
        : isOpen
          ? 'var(--accent)'
          : 'var(--border)';
    const boxShadow = error
        ? '0 0 0 3px rgba(255,69,58,0.18)'
        : isOpen
          ? '0 0 0 3px rgba(10,132,255,0.2)'
          : 'none';

    return (
        <div style={{ position: 'relative' }}>
            {/* ── Chip — committed value, field closed ── */}
            {value && !isOpen ? (
                <div
                    onClick={openEditor}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: 'var(--bg1)',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'text',
                        transition: 'border .15s, box-shadow .15s',
                        boxShadow,
                    }}
                >
                    {matched ? (
                        <>
                            <div
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: matched.color + '33',
                                    color: matched.color,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                {matched.photo ? (
                                    <img
                                        src={matched.photo}
                                        alt={matched.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    initials(matched.name)
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text)',
                                    }}
                                >
                                    {matched.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text3)',
                                    }}
                                >
                                    {matched.handle}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: 'var(--bg3)',
                                    color: 'var(--text2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                #
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: 13,
                                    color: 'var(--text)',
                                }}
                            >
                                {value}
                            </div>
                        </>
                    )}
                    <button
                        onMouseDown={clear}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: '0 2px',
                            lineHeight: 1,
                            flexShrink: 0,
                        }}
                        title='Clear'
                    >
                        ✕
                    </button>
                </div>
            ) : (
                /* ── Text input ── */
                <input
                    ref={inputRef}
                    type='text'
                    autoComplete='off'
                    value={inputText}
                    onChange={(e) => {
                        // Update only local inputText — never the parent's value mid-type
                        setInputText(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        // Delay so onMouseDown on a row fires before blur
                        setTimeout(() => commit(inputText), 150);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commit(inputText);
                        }
                        if (e.key === 'Escape') {
                            setInputText('');
                            setIsOpen(false);
                        }
                    }}
                    placeholder={
                        contacts.length > 0
                            ? 'Search by name, or enter phone / Apple ID…'
                            : '+1 (555) 000-0000 or name@icloud.com'
                    }
                    style={{
                        borderColor,
                        boxShadow,
                        transition: 'border .15s, box-shadow .15s',
                    }}
                />
            )}

            {/* ── Dropdown ── */}
            {isOpen && filteredContacts.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
                        zIndex: 99,
                        maxHeight: 240,
                        overflowY: 'auto',
                    }}
                >
                    {filteredContacts.map((c) => (
                        <div
                            key={c.id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                select(c);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border2)',
                                transition: 'background .1s',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                    'var(--bg2)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                    'transparent')
                            }
                        >
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: c.color + '22',
                                    color: c.color,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {c.photo ? (
                                    <img
                                        src={c.photo}
                                        alt={c.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    initials(c.name)
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: 'var(--text)',
                                    }}
                                >
                                    {q && c.name.toLowerCase().includes(q)
                                        ? (() => {
                                              const i = c.name
                                                  .toLowerCase()
                                                  .indexOf(q);
                                              return (
                                                  <>
                                                      {c.name.slice(0, i)}
                                                      <span
                                                          style={{
                                                              color: 'var(--accent)',
                                                              fontWeight: 700,
                                                          }}
                                                      >
                                                          {c.name.slice(
                                                              i,
                                                              i + q.length,
                                                          )}
                                                      </span>
                                                      {c.name.slice(
                                                          i + q.length,
                                                      )}
                                                  </>
                                              );
                                          })()
                                        : c.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--text3)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {c.handle}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
function MsgTypeToggle({ value, onChange }) {
    const opts = [
        {
            id: 'imessage',
            label: 'iMessage',
            icon: '💬',
            desc: 'Internet, via Apple ID or phone',
            color: '#0a84ff',
            bg: 'rgba(10,132,255,0.15)',
            border: 'rgba(10,132,255,0.4)',
        },
        {
            id: 'sms',
            label: 'SMS',
            icon: '📱',
            desc: 'Green bubble — needs iPhone Continuity',
            color: '#30d158',
            bg: 'rgba(48,209,88,0.15)',
            border: 'rgba(48,209,88,0.4)',
        },
    ];
    return (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {opts.map((o) => {
                const active = value === o.id;
                return (
                    <div
                        key={o.id}
                        onClick={() => onChange(o.id)}
                        style={{
                            flex: 1,
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1.5px solid ${active ? o.border : 'var(--border)'}`,
                            background: active ? o.bg : 'var(--bg1)',
                            cursor: 'pointer',
                            transition: 'all .15s',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{o.icon}</span>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: active ? o.color : 'var(--text2)',
                                }}
                            >
                                {o.label}
                            </span>
                            {active && (
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: o.color,
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--text3)',
                                lineHeight: 1.4,
                            }}
                        >
                            {o.desc}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Message sequence ──────────────────────────────────────────────────────────
function MsgSequence({ messages, onChange }) {
    const add = () => onChange([...messages, '']);
    const remove = (i) => {
        if (messages.length <= 1) return;
        onChange(messages.filter((_, j) => j !== i));
    };
    const update = (i, val) =>
        onChange(messages.map((m, j) => (j === i ? val : m)));
    return (
        <div>
            {messages.map((msg, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 8,
                        alignItems: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--bg2)',
                            color: 'var(--text3)',
                            fontSize: 10,
                            fontWeight: 600,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 10,
                        }}
                    >
                        {i + 1}
                    </div>
                    <textarea
                        placeholder={`Message ${i + 1}…`}
                        value={msg}
                        onChange={(e) => update(i, e.target.value)}
                        style={{ flex: 1, minHeight: 60 }}
                    />
                    <button
                        onClick={() => remove(i)}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-xs)',
                            background: 'none',
                            border: '1px solid var(--border)',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            marginTop: 8,
                            transition: 'all .15s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                'rgba(255,69,58,0.15)';
                            e.currentTarget.style.color = 'var(--red)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--text3)';
                        }}
                        title='Remove'
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button
                className='btn btn-ghost'
                onClick={add}
                style={{
                    width: '100%',
                    marginTop: 4,
                    fontSize: 12,
                    border: '1px dashed var(--border)',
                    color: 'var(--accent)',
                }}
            >
                + Add message to sequence
            </button>
        </div>
    );
}

// ── Preview ───────────────────────────────────────────────────────────────────
function Preview({
    recipient,
    messages,
    date,
    time,
    freq,
    cNum,
    cUnit,
    msgType,
    contacts,
}) {
    const label = freqLabel(freq, cNum, cUnit);
    const validMsgs = messages.filter(Boolean);
    const isSMS = msgType === 'sms';
    const matched = contacts.find(
        (c) =>
            c.handle === recipient ||
            (digits(c.handle) && digits(c.handle) === digits(recipient)),
    );
    const displayName = matched?.name ?? recipient;

    return (
        <div
            className='card'
            style={{ position: 'sticky', top: 0 }}
        >
            <div className='card-header'>
                <div className='card-title'>Preview</div>
                <span
                    style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: isSMS
                            ? 'rgba(48,209,88,0.15)'
                            : 'rgba(10,132,255,0.15)',
                        color: isSMS ? 'var(--green)' : 'var(--accent)',
                        border: `1px solid ${isSMS ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.3)'}`,
                    }}
                >
                    {isSMS ? '📱 SMS' : '💬 iMessage'}
                </span>
            </div>
            <div
                style={{
                    background: 'var(--bg0)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    minHeight: 120,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--text3)',
                        textAlign: 'center',
                        marginBottom: 12,
                    }}
                >
                    {displayName || '—'}
                </div>
                {validMsgs.length === 0 ? (
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--text3)',
                            textAlign: 'center',
                        }}
                    >
                        Messages will appear here
                    </div>
                ) : (
                    validMsgs.map((m, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginBottom: 6,
                            }}
                        >
                            <div
                                style={{
                                    background: isSMS
                                        ? '#1a8a3c'
                                        : 'var(--accent)',
                                    color: '#fff',
                                    borderRadius: '14px 14px 4px 14px',
                                    padding: '8px 12px',
                                    fontSize: 12,
                                    maxWidth: '80%',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.4,
                                }}
                            >
                                {m}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {isSMS && (
                <div
                    style={{
                        marginTop: 12,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(255,214,10,0.08)',
                        border: '1px solid rgba(255,214,10,0.2)',
                        fontSize: 11,
                        color: 'var(--yellow)',
                        lineHeight: 1.6,
                    }}
                >
                    ⚠️ SMS requires iPhone on same Wi-Fi (Settings → Messages →
                    Text Message Forwarding).
                </div>
            )}
            <div className='separator' />
            <div
                style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 2.2 }}
            >
                <div>
                    📅 {date && time ? `${date} at ${time}` : 'Not scheduled'}
                </div>
                <div>{freq === 'once' ? '🔂 Send once' : `🔁 ${label}`}</div>
            </div>
            <div className='separator' />
            <div
                className='card-header'
                style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}
            >
                <div className='card-title'>💡 How it works</div>
            </div>
            <div
                style={{
                    fontSize: 12,
                    color: 'var(--text2)',
                    lineHeight: 1.9,
                    marginTop: 10,
                }}
            >
                <b style={{ color: 'var(--text)' }}>1.</b> Schedule your message
                here
                <br />
                <b style={{ color: 'var(--text)' }}>2.</b> Click{' '}
                <b style={{ color: 'var(--text)' }}>View script</b> on the queue
                item
                <br />
                <b style={{ color: 'var(--text)' }}>3.</b> Copy → paste into
                Script Editor.app
                <br />
                <b style={{ color: 'var(--text)' }}>4.</b> Follow the Terminal
                setup steps
                <br />
                <b style={{ color: 'var(--text)' }}>5.</b> Mac sends messages
                automatically
            </div>
        </div>
    );
}

// ── Main Compose view ─────────────────────────────────────────────────────────
export default function Compose() {
    const { contacts, addScheduled, navigate, prefill, clearPrefill } =
        useApp();
    const { date: d0, time: t0 } = todayPlus1h();

    const [msgType, setMsgType] = useState('imessage');
    const [recipient, setRecipient] = useState('');
    const [recipientError, setRecipientError] = useState('');
    const [messages, setMessages] = useState(['']);
    const [date, setDate] = useState(d0);
    const [time, setTime] = useState(t0);
    const [freq, setFreq] = useState('once');
    const [cNum, setCNum] = useState('2');
    const [cUnit, setCUnit] = useState('days');
    const [error, setError] = useState('');

    useEffect(() => {
        if (prefill?.recipient) {
            setRecipient(prefill.recipient);
            if (prefill.msgType) setMsgType(prefill.msgType);
            clearPrefill();
        }
    }, [prefill, clearPrefill]);

    const showError = useCallback((msg) => {
        setError(msg);
        setTimeout(() => setError(''), 3500);
    }, []);

    const handleSchedule = async () => {
        // Validate recipient — shows inline error on the field
        const rErr = validateRecipient(recipient, contacts);
        if (rErr) {
            setRecipientError(rErr);
            return;
        }
        setRecipientError('');

        if (!messages.filter(Boolean).length)
            return showError('Write at least one message.');
        if (!date || !time) return showError('Set a date and time.');

        const item = {
            recipient: recipient.trim(),
            msgType,
            messages: messages.filter(Boolean),
            date,
            time,
            freq,
            cNum,
            cUnit,
            flabel: freqLabel(freq, cNum, cUnit),
            paused: false,
            color: colorForName(recipient.trim()),
        };
        await addScheduled(item);
        setRecipient('');
        setMessages(['']);
        setMsgType('imessage');
        setRecipientError('');
        setFreq('once');
        setCNum('2');
        setCUnit('days');
        navigate('queue');
    };

    return (
        <div>
            <div
                className='flex-between'
                style={{ marginBottom: 24 }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 26,
                            fontWeight: 600,
                            letterSpacing: '-.03em',
                        }}
                    >
                        Compose
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--text3)',
                            marginTop: 3,
                        }}
                    >
                        Schedule a new message
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 340px',
                    gap: 24,
                    alignItems: 'start',
                }}
            >
                <div>
                    {/* Channel */}
                    <div className='card'>
                        <div className='card-header'>
                            <div className='card-title'>Message Type</div>
                        </div>
                        <MsgTypeToggle
                            value={msgType}
                            onChange={setMsgType}
                        />
                    </div>

                    {/* Recipient */}
                    <div className='card'>
                        <div className='card-header'>
                            <div>
                                <div className='card-title'>Recipient</div>
                                <div className='card-subtitle'>
                                    {msgType === 'sms'
                                        ? 'Phone number required for SMS'
                                        : 'Phone number or Apple ID email'}
                                </div>
                            </div>
                        </div>
                        <div className='field'>
                            <label>To</label>
                            <ContactSearchInput
                                contacts={contacts}
                                value={recipient}
                                onChange={(v) => {
                                    setRecipient(v);
                                    setRecipientError('');
                                }}
                                onBlurValidate={(committedValue) => {
                                    // Use the value just committed by the input component —
                                    // the parent's `recipient` state may not have updated yet.
                                    const toCheck =
                                        committedValue !== undefined
                                            ? committedValue
                                            : recipient;
                                    const err = validateRecipient(
                                        toCheck,
                                        contacts,
                                    );
                                    if (err) setRecipientError(err);
                                }}
                                error={recipientError}
                            />
                            {recipientError && (
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--red)',
                                        marginTop: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>⚠</span>{' '}
                                    {recipientError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className='card'>
                        <div className='card-header'>
                            <div
                                className='flex-between'
                                style={{ width: '100%' }}
                            >
                                <div>
                                    <div className='card-title'>
                                        Message Sequence
                                    </div>
                                    <div className='card-subtitle'>
                                        Sent in order, one after another
                                    </div>
                                </div>
                            </div>
                        </div>
                        <MsgSequence
                            messages={messages}
                            onChange={setMessages}
                        />
                    </div>

                    {/* Schedule */}
                    <div className='card'>
                        <div className='card-header'>
                            <div className='card-title'>
                                Schedule &amp; Frequency
                            </div>
                        </div>
                        <div className='row2'>
                            <div className='field'>
                                <label>Date</label>
                                <input
                                    type='date'
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className='field'>
                                <label>Time</label>
                                <input
                                    type='time'
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='field'>
                            <label>Frequency</label>
                            <select
                                value={freq}
                                onChange={(e) => setFreq(e.target.value)}
                            >
                                <option value='once'>Send once</option>
                                <option value='hourly'>Every hour</option>
                                <option value='daily'>Every day</option>
                                <option value='weekly'>Every week</option>
                                <option value='monthly'>Every month</option>
                                <option value='custom'>Custom interval…</option>
                            </select>
                        </div>
                        {freq === 'custom' && (
                            <div className='row2'>
                                <div className='field'>
                                    <label>Every</label>
                                    <input
                                        type='number'
                                        value={cNum}
                                        min='1'
                                        onChange={(e) =>
                                            setCNum(e.target.value)
                                        }
                                    />
                                </div>
                                <div className='field'>
                                    <label>Unit</label>
                                    <select
                                        value={cUnit}
                                        onChange={(e) =>
                                            setCUnit(e.target.value)
                                        }
                                    >
                                        <option value='minutes'>Minutes</option>
                                        <option value='hours'>Hours</option>
                                        <option value='days'>Days</option>
                                        <option value='weeks'>Weeks</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className='separator' />
                        <button
                            className='btn btn-primary'
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: 12,
                            }}
                            onClick={handleSchedule}
                        >
                            Schedule{' '}
                            {msgType === 'sms' ? 'Text Message' : 'iMessage'}
                        </button>
                        {error && (
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--red)',
                                    marginTop: 8,
                                }}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <Preview
                    msgType={msgType}
                    recipient={recipient}
                    messages={messages}
                    date={date}
                    time={time}
                    freq={freq}
                    cNum={cNum}
                    cUnit={cUnit}
                    contacts={contacts}
                />
            </div>
        </div>
    );
}
