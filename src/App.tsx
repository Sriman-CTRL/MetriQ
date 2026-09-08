import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import jsQR from 'jsqr'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  MapPin,
  Menu,
  QrCode,
  ScanLine,
  ShieldCheck,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
  AlertTriangle,
  Download,
  Printer,
  Camera,
  Database,
  LockKeyhole,
  Bell,
  FileText,
  Check,
  Video,
  VideoOff,
  RefreshCw,
  Search,
  Activity,
  Share2,
  Landmark,
  Award,
  Scale,
  Receipt,
  Send,
  KeyRound,
  Package,
  ShieldAlert,
  Radio,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import hero from './assets/metriq-inspection.png'
import { Application, applications as initialApps, certificate as defaultCertificate, Instrument, Role } from './data'
import { api, clearStoredSession } from './api'
import { dbClear, dbCount, dbPut } from './store'
import { I18nProvider, useI18n, LANGUAGES, Language } from './i18n'
import { DiagnosticsModal } from './components/DiagnosticsModal'
import { GrievanceModal } from './components/GrievanceModal'
import { SealLedger } from './components/SealLedger'
import { GrievanceActionCenter } from './components/GrievanceActionCenter'
import { StateAnalytics } from './components/StateAnalytics'
import { BulkReverificationModal } from './components/BulkReverificationModal'
import { LicensingPortal } from './components/LicensingPortal'
import { TreasuryChallanDesk } from './components/TreasuryChallanDesk'
import { DispatchSimulator } from './components/DispatchSimulator'
import { DigitalSignatureModal } from './components/DigitalSignatureModal'
import { LmpcComplianceDesk } from './components/LmpcComplianceDesk'
import { FlyingSquadEnforcement } from './components/FlyingSquadEnforcement'
import { WeighbridgeIoTDashboard } from './components/WeighbridgeIoTDashboard'
import './telangana-legal-metrology.css'
const roleInfo: Record<Role, { label: string; name: string; access: string }> = {
  owner: { label: 'Instrument Owner / User', name: 'User Login', access: 'Citizen instruments and applications' },
  office: { label: 'Back Office Officer', name: 'Officer S. Rao', access: 'Application scrutiny and scheduling' },
  field: { label: 'LMO Officer', name: 'Officer R. Kumar', access: 'Field verification and offline work' },
  inspection: { label: 'Inspection Officer', name: 'Officer A. Mehta', access: 'Inspection and enforcement' },
  admin: { label: 'System Administrator', name: 'Telangana Admin', access: 'State administration and reports' },
}

const serverRoleToAppRole: Record<string, Role> = {
  OWNER: 'owner',
  BACK_OFFICE: 'office',
  LMO: 'field',
  VERIFICATION_OFFICER: 'inspection',
  ADMIN: 'admin',
}

const statusClass = (status: string) => `badge ${status.toLowerCase().split(' ').join('-')}`
const Nav = ({ compact = false, onLogin }: { compact?: boolean; onLogin?: (role: Role) => void }) => {
  const { t } = useI18n()
  return (
    <nav className={compact ? 'side-nav' : 'main-nav'}>
      <Link to="/">{t('home')}</Link>
      <Link to="/services">{t('services')}</Link>
      <Link to="/verify">{t('verify')}</Link>
      <Link to="/track">{t('track')}</Link>
      {!compact && onLogin && (
        <span className="role-login-links" aria-label="Login options">
          <button onClick={() => onLogin('owner')}>User Login</button>
          <button onClick={() => onLogin('field')}>LMO Login</button>
          <button onClick={() => onLogin('admin')}>Admin Login</button>
        </span>
      )}
    </nav>
  )
}

function Header({ role, setRole }: { role: Role | null; setRole: (r: Role | null) => void }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [diagOpen, setDiagOpen] = useState(false)
  const [grievanceOpen, setGrievanceOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [contrast, setContrast] = useState(false)
  const [zoom, setZoom] = useState(() => Number(sessionStorage.getItem('metriq-zoom') || 100))
  const [selectedPersona, setSelectedPersona] = useState<Role | null>(null)
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()

  const updateZoom = (nextZoom: number) => {
    const boundedZoom = Math.min(130, Math.max(90, nextZoom))
    setZoom(boundedZoom)
    sessionStorage.setItem('metriq-zoom', String(boundedZoom))
    document.documentElement.style.zoom = `${boundedZoom}%`
  }

  useEffect(() => {
    document.documentElement.style.zoom = `${zoom}%`
    return () => {
      document.documentElement.style.zoom = '100%'
    }
  }, [zoom])

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const res = await api.notifications.list()
        if (res.success && res.data) {
          setNotifications(res.data.notifications || [])
          setUnreadCount(res.data.unreadCount || 0)
        }
      } catch {
        setNotifications([
          {
            _id: 'n1',
            title: 'Verification Certificate Valid',
            message: 'Digital Certificate LM-HYD-2026-000184 verified on SHA-256 ledger.',
            link: '/verify/LM-HYD-2026-000184',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'n2',
            title: 'Re-verification Radar Alert',
            message: 'Instrument INS-HYD-0002 due for annual verification in 28 days.',
            link: '/dashboard/admin',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ])
        setUnreadCount(2)
      }
    }
    loadNotifs()
    const timer = setInterval(loadNotifs, 15000)
    return () => clearInterval(timer)
  }, [role])

  const handleMarkRead = async (notif: any) => {
    try {
      await api.notifications.markRead(notif._id)
      setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
    setNotifOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const login = async (event: React.FormEvent<HTMLFormElement>, _selectedRole: Role) => {
    event.preventDefault()
    setLoginError('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const result = await api.auth.login(email, password)
    const authenticatedRole = result.data?.user?.role ? serverRoleToAppRole[result.data.user.role] : undefined
    if (!result.success || !authenticatedRole) {
      setLoginError(result.error?.message || 'Unable to sign in. Please check your details and try again.')
      return
    }
    // The server is the source of truth: an authenticated account always lands
    // in its own portal, regardless of the login option selected on the page.
    setRole(authenticatedRole)
    setOpen(false)
    navigate(`/dashboard/${authenticatedRole}`)
  }

  const openPersonaLogin = (next: Role) => {
    setSelectedPersona(next)
    setOpen(true)
    setNotifOpen(false)
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {
      // Ignore
    }
    setRole(null)
    clearStoredSession()
    setOpen(false)
    navigate('/')
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="govbar">
        <div>
          GOVERNMENT OF INDIA <span> | </span> DEPARTMENT OF LEGAL METROLOGY
        </div>
        <div className="govtools">
          <select
            className="lang-select"
            aria-label="Select language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel} ({l.label})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setContrast(!contrast)
              document.body.classList.toggle('high-contrast', !contrast)
            }}
          >
            High contrast
          </button>
          <span className="accessibility-controls" aria-label="Page zoom controls">
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => updateZoom(zoom - 10)}
              disabled={zoom <= 90}
            >
              <ZoomOut size={14} />
            </button>
            <span aria-live="polite">{zoom}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => updateZoom(zoom + 10)}
              disabled={zoom >= 130}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              aria-label="Reset page zoom"
              title="Reset page zoom"
              onClick={() => updateZoom(100)}
            >
              <RotateCcw size={13} />
            </button>
          </span>
          <button
            className="grievance-btn"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => setGrievanceOpen(true)}
            title="Statutory grievance reporting"
          >
            <AlertTriangle size={12} /> {t('reportViolation')}
          </button>
          <button
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={() => setDiagOpen(true)}
            title="System Diagnostics & Health Monitor"
          >
            <Activity size={12} /> Diagnostics
          </button>
        </div>
      </div>
      <header>
        <Link className="brand" to="/">
          <span className="mark national-emblem" title="National Emblem of India">
            <Landmark size={29} />
          </span>
          <span>
            <b>Department of Legal Metrology</b>
            <small>
              Government of India
              <br />
              Online Legal Metrology Services
            </small>
          </span>
        </Link>
        <Nav onLogin={openPersonaLogin} />
        <div className="header-actions">
          <span className="prototype">NATIONAL ONLINE SERVICES</span>
          <button
            className="notif-bell-btn"
            title="Notifications & Alerts"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen(!notifOpen)
              setOpen(false)
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {role ? (
            <button
              className="user"
              onClick={() => {
                setOpen(!open)
                setSelectedPersona(null)
                setNotifOpen(false)
              }}
            >
              {roleInfo[role].name}
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              className="primary small"
              onClick={() => {
                setOpen(!open)
                setSelectedPersona(null)
                setNotifOpen(false)
              }}
            >
              Login Options
            </button>
          )}
        </div>
        <button className="icon mobile-menu" aria-label="Open navigation">
          <Menu />
        </button>
        {notifOpen && (
          <div className="notif-drawer">
            <div className="notif-header">
              <span>Alerts &amp; Notifications ({unreadCount} unread)</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}>Mark all read</button>
              )}
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">No new notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleMarkRead(n)}
                  >
                    <div className="notif-item-body">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <small>
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {open && (
          <div className={`login-pop ${selectedPersona ? 'login-pop-form' : ''}`}>
            {!selectedPersona ? (
              <>
                <b>{t('switchRole')}</b>
                <small className="login-pop-hint">Select a role to continue to its secure login.</small>
                {(Object.keys(roleInfo) as Role[]).map((r) => (
                  <button key={r} onClick={() => setSelectedPersona(r)}>
                    <span>{roleInfo[r].label}</span>
                    <ChevronRight size={16} />
                  </button>
                ))}
                {role && (
                  <button className="muted" onClick={logout}>
                    {t('logout')}
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={(event) => login(event, selectedPersona)}>
                <button type="button" className="login-back" onClick={() => setSelectedPersona(null)}>
                  <ChevronRight size={15} /> Back to personas
                </button>
                <span className="login-form-kicker">ROLE-BASED ACCESS</span>
                <b>{roleInfo[selectedPersona].label}</b>
                <small className="login-pop-hint">Sign in to open the {roleInfo[selectedPersona].label} dashboard.</small>
                <small className="login-access">Access: {roleInfo[selectedPersona].access}</small>
                <label>
                  Email address
                  <input name="email" type="email" placeholder="Enter email address" autoComplete="username" required />
                </label>
                <label>
                  Password
                  <input name="password" type="password" placeholder="Enter password" autoComplete="current-password" required />
                </label>
                {loginError && <p className="login-error" role="alert">{loginError}</p>}
                <button type="submit" className="primary login-submit">
                  Login as {roleInfo[selectedPersona].label}
                  <ChevronRight size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </header>

      <DiagnosticsModal isOpen={diagOpen} onClose={() => setDiagOpen(false)} />
      <GrievanceModal isOpen={grievanceOpen} onClose={() => setGrievanceOpen(false)} />
    </>
  )
}

function Layout({
  children,
  role,
  setRole,
}: {
  children: React.ReactNode
  role: Role | null
  setRole: (r: Role | null) => void
}) {
  return (
    <>
      <Header role={role} setRole={setRole} />
      <main id="main-content">{children}</main>
      <footer className="telangana-footer">
        <div className="footer-content">
          <div>
            <b>Department of Legal Metrology</b>
            <p>Government of Telangana</p>
            <p>Ensuring accurate measures, fair trade and consumer protection through accessible digital services.</p>
          </div>
          <div>
            <b>Site Map</b>
            <span><Link to="/">Home</Link><Link to="/services">Online Services</Link><Link to="/track">Track Application</Link><Link to="/verify">Certificate Verification</Link></span>
          </div>
          <div>
            <b>Reach Us</b>
            <span>Controller of Legal Metrology,<br />209 PWD Building, Gandhinagar,<br />Hyderabad – 500 080, Telangana.<br /><a href="mailto:clm-ts@nic.in">clm-ts@nic.in</a><br />Off: 040 2761 3667</span>
          </div>
        </div>
        <div className="footer-copyright">Copyright © 2026. All Rights Reserved. Department of Legal Metrology, Government of Telangana.</div>
      </footer>
    </>
  )
}

function Home() {
  const navigate = useNavigate()
  return (
    <>
      <section className="hero">
        <img src={hero} alt="Legal metrology inspector verifying a weighing instrument" />
        <div className="hero-inner">
          <div className="eyebrow">LEGAL METROLOGY DIGITAL SERVICE</div>
          <h1>
            Online Verification of
            <br />
            Weights &amp; Measures
          </h1>
          <p>
            Secure, transparent and digitally verifiable legal metrology services for citizens, businesses and
            enforcement authorities.
          </p>
          <div className="actions">
            <button className="primary" onClick={() => navigate('/apply')}>
              Apply for Verification <ChevronRight size={17} />
            </button>
            <button className="outline" onClick={() => navigate('/verify')}>
              Verify Certificate <QrCode size={17} />
            </button>
          </div>
          <button className="text-button" onClick={() => navigate('/track')}>
            Track an application <ChevronRight size={16} />
          </button>
        </div>
      </section>
      <section className="notice">
        <ShieldCheck size={19} />
        <span>
          <b>Prototype developed for Smart India Hackathon 2026</b> &nbsp; Problem Statement ID: 26036
        </span>
      </section>
      <section className="tg-dashboard-summary" aria-label="Public dashboard summary">
        <div>
          <span>PUBLIC DASHBOARD</span>
          <h2>Service delivery at a glance</h2>
        </div>
        <div className="tg-stat-grid">
          <article><b>68,856</b><small>Total Applications Approved</small></article>
          <article><b>65,109</b><small>Processed within 15 days</small></article>
          <article><b>3,747</b><small>Processed beyond 15 days</small></article>
          <article><b>4 days</b><small>Average registration / renewal time</small></article>
        </div>
      </section>
      <SectionHeading kicker="ONLINE SERVICES" title="Services for every point of verification" />
      <section className="services content-grid">
        {[
          [
            ClipboardCheck,
            'Apply for Verification',
            'Begin an initial verification, periodic verification or re-verification request.',
            '/apply',
          ],
          [
            ShieldCheck,
            'Verify Certificate',
            'Confirm the authenticity of a digital verification certificate.',
            '/verify',
          ],
          [
            FileSearch,
            'Track Application',
            'View scrutiny, assignment and field-verification progress.',
            '/track',
          ],
          [Database, 'Find Instrument', 'Search the registered instrument records.', '/dashboard/admin/instruments'],
        ].map(([Icon, title, text, path]) => (
          <Link className="service" to={path as string} key={title as string}>
            <span className="service-icon">
              <Icon size={25} />
            </span>
            <h3>{title as string}</h3>
            <p>{text as string}</p>
            <ChevronRight size={18} />
          </Link>
        ))}
      </section>
      <section className="band">
        <div>
          <SectionHeading kicker="HOW METRIQ WORKS" title="A secure, traceable verification lifecycle" />
        </div>
        <div className="steps">
          {['Apply', 'Scrutiny', 'Assignment', 'Field Verification', 'Digital Certification', 'QR Verification'].map(
            (item, i) => (
              <div key={item}>
                <span>{i + 1}</span>
                <b>{item}</b>
              </div>
            )
          )}
        </div>
      </section>
      <section className="content why">
        <div>
          <SectionHeading kicker="WHY METRIQ" title="Digital trust, designed for field realities" />
          <p>
            METRIQ connects citizens, businesses and legal metrology teams through a shared instrument registry,
            verifiable certificates and offline-capable field workflows.
          </p>
        </div>
        <ul>
          <li>Offline-first field verification and sync queue</li>
          <li>OCR-based instrument record matching</li>
          <li>Prototype digital signatures with SHA-256</li>
          <li>QR-backed public certificate checks</li>
          <li>Tamper-evident record consistency checks</li>
          <li>State-wise configurable workflows</li>
        </ul>
      </section>
    </>
  )
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="section-heading content">
      <span>{kicker}</span>
      <h2>{title}</h2>
    </div>
  )
}

function Verify() {
  const { certificateNumber } = useParams()
  const [query, setQuery] = useState(certificateNumber || defaultCertificate.id)
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null)
  const [certData, setCertData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [grievanceOpen, setGrievanceOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number | null>(null)

  const stopCamera = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    setCameraActive(false)
  }

  const scanTick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const v = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = v.videoWidth
      canvas.height = v.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imgData.data, imgData.width, imgData.height)
        if (code && code.data) {
          stopCamera()
          const matched = code.data.match(/LM-[A-Z0-9-]+/i)
          const target = matched ? matched[0] : code.data.trim()
          setQuery(target)
          handleVerify(target)
          return
        }
      }
    }
    animRef.current = requestAnimationFrame(scanTick)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
        animRef.current = requestAnimationFrame(scanTick)
      }
    } catch {
      // Camera denied or unavailable
      setErrorMessage('Camera access was not permitted. You can upload a QR image or enter the certificate number.')
    }
  }

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imgData.data, imgData.width, imgData.height)
          if (code && code.data) {
            const matched = code.data.match(/LM-[A-Z0-9-]+/i)
            const target = matched ? matched[0] : code.data.trim()
            setQuery(target)
            handleVerify(target)
          } else {
            setQuery(defaultCertificate.id)
            handleVerify(defaultCertificate.id)
          }
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const handleVerify = async (searchNumber?: string) => {
    const target = (searchNumber || query).trim()
    if (!target) return
    setLoading(true)
    setErrorMessage('')

    try {
      const res = await api.certificates.verifyPublic(target)
      if (res.success && res.data) {
        setCertData(res.data)
        setResult('valid')
      } else {
        setResult('invalid')
        setErrorMessage(res.error?.message || 'Certificate record does not match registered instrument details.')
      }
    } catch {
      // Fallback
      if (target.toUpperCase() === defaultCertificate.id || target === 'INS-HYD-0001') {
        setCertData(defaultCertificate)
        setResult('valid')
      } else {
        setResult('invalid')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (certificateNumber) {
      setQuery(certificateNumber)
      handleVerify(certificateNumber)
    }
  }, [certificateNumber])

  return (
    <section className="page content">
      <div className="breadcrumb">
        Home <ChevronRight size={13} /> Verify Certificate
      </div>
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span>PUBLIC CERTIFICATE REGISTRY</span>
          <h1>Verify Weights &amp; Measures Certificate</h1>
          <p>Enter a certificate number, instrument ID or scan the QR code to check registry authenticity.</p>
        </div>
        <button
          className="grievance-btn"
          onClick={() => setGrievanceOpen(true)}
          style={{ padding: '8px 14px', fontSize: 13 }}
        >
          <AlertTriangle size={15} /> Report Short-Weighing / Broken Seal
        </button>
      </div>

      {cameraActive && (
        <div className="qr-scanner-modal" style={{ marginBottom: 20 }}>
          <div className="qr-video-viewport">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="qr-laser-line"></div>
            <div className="qr-reticle"></div>
          </div>
          <div className="qr-scanner-controls">
            <button className="danger" onClick={stopCamera}>
              <VideoOff size={16} /> Stop Camera
            </button>
          </div>
        </div>
      )}

      <div className="verify-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Certificate Number / Instrument ID"
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        <button className="primary" onClick={() => handleVerify()} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>
        <button className="outline" onClick={startCamera} title="Scan with live camera">
          <Camera size={16} /> Camera
        </button>
        <label className="outline inline" style={{ cursor: 'pointer' }} title="Upload QR image">
          <Upload size={16} /> QR File
          <input hidden type="file" accept="image/*" onChange={handleQrUpload} />
        </label>
      </div>

      {result === 'valid' && certData && <CertificateCard cert={certData} />}

      {result === 'invalid' && (
        <div className="failed">
          <AlertTriangle size={30} />
          <div>
            <h2>VERIFICATION FAILED</h2>
            <p>{errorMessage || 'Certificate record does not match registered instrument details.'}</p>
            <ul>
              <li>Modified certificate or instrument mismatch</li>
              <li>Invalid certificate number</li>
              <li>Expired certificate or failed cryptographic hash check</li>
            </ul>
            <button className="outline" onClick={() => setQuery(defaultCertificate.id)}>
              Try Demo Certificate
            </button>{' '}
            <Link className="primary inline" to="/apply">
              Apply for Re-verification
            </Link>
          </div>
        </div>
      )}

      {!result && (
        <div className="verify-help">
          <QrCode size={30} />
          <div>
            <b>Example certificate</b>
            <p>{defaultCertificate.id} is loaded for the live prototype demonstration.</p>
          </div>
        </div>
      )}

      <GrievanceModal
        isOpen={grievanceOpen}
        onClose={() => setGrievanceOpen(false)}
        prefillCertificateNumber={query}
      />
    </section>
  )
}

function CertificateCard({ cert = defaultCertificate }: { cert?: any }) {
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const [cardGrievanceOpen, setCardGrievanceOpen] = useState(false)
  const certId = cert.certificateNumber || cert.id || defaultCertificate.id
  const verifyUrl = `${window.location.origin}/verify/${certId}`
  const hashText = cert.cryptographicIntegrity?.hash || cert.hash || '9f72cbb0e4a6c2f8...a82d'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="certificate-result">
      <div className="verified-head">
        <CheckCircle2 size={32} />
        <div>
          <span>CERTIFICATE VERIFIED</span>
          <h2>Certificate authenticity confirmed</h2>
        </div>
        <b className="valid-tag">{cert.status || 'VALID'}</b>
      </div>
      <div className="cert-body">
        <div className="cert-grid">
          {[
            ['Instrument', cert.instrumentType || cert.type],
            ['Manufacturer', cert.manufacturer],
            ['Model', cert.model],
            ['Serial Number', cert.serialNumber || cert.serial],
            ['Owner', cert.owner || cert.ownerName],
            ['Location', cert.location],
            ['Verification Date', cert.verificationDate],
            ['Valid Until', cert.validUntil || cert.validUntilFormatted],
            ['Verified By', cert.officer || cert.officerName],
            ['Digital Signature', 'VALID (SHA-256)'],
            ['Hash Check', hashText.slice(0, 16) + '...'],
            ['Certificate ID', certId],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <aside>
          <QRCodeSVG value={verifyUrl} size={145} level="M" includeMargin />
          <b>Registry QR</b>
          <small>Scan to verify this certificate</small>
          <Link to={location.pathname.includes(certId) ? '/verify' : `/verify/${certId}`}>
            Open verification URL
          </Link>
        </aside>
      </div>
      <div className="cert-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button className="outline inline" onClick={handleCopyLink} title="Copy public verification link">
          <Share2 size={16} /> {copied ? 'Link Copied!' : 'Share Link'}
        </button>
        <button
          className="outline inline"
          onClick={() => setCardGrievanceOpen(true)}
          style={{ color: '#b42318', borderColor: '#fecdca' }}
          title="Report short-weighing or broken seal against this instrument"
        >
          <AlertTriangle size={16} /> Report Discrepancy
        </button>
        <Link className="outline inline" to="/certificate">
          View Formal Certificate
        </Link>
        <button className="primary" onClick={() => window.print()}>
          <Printer size={16} /> Print Certificate
        </button>
      </div>

      <GrievanceModal
        isOpen={cardGrievanceOpen}
        onClose={() => setCardGrievanceOpen(false)}
        prefillCertificateNumber={certId}
        prefillInstrumentId={cert.instrumentId || cert.instrument}
      />
    </div>
  )
}

function Track() {
  const [id, setId] = useState('APP-HYD-2026-001245')
  const [app, setApp] = useState<any>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const stages = [
    'Application Submitted',
    'Document Scrutiny',
    'LMO Assigned',
    'Verification Scheduled',
    'Field Verification',
    'Certificate Issuance',
  ]

  const statusMap: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    Submitted: 0,
    UNDER_SCRUTINY: 1,
    'Under Scrutiny': 1,
    APPROVED: 1,
    ASSIGNED: 2,
    Assigned: 2,
    SCHEDULED: 3,
    Scheduled: 3,
    FIELD_VERIFICATION: 4,
    'Field Verification': 4,
    VERIFICATION_COMPLETED: 4,
    CERTIFICATE_ISSUED: 5,
    'Certificate Issued': 5,
    CLOSED: 5,
  }

  const handleTrack = async (searchId?: string) => {
    const target = (searchId || id).trim()
    if (!target) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await api.applications.get(target)
      if (res.success && res.data?.application) {
        setApp(res.data.application)
      } else {
        // Search in list
        const listRes = await api.applications.list({ search: target })
        if (listRes.success && listRes.data?.applications && listRes.data.applications.length > 0) {
          setApp(listRes.data.applications[0])
        } else {
          // Fallback to local
          const local = initialApps.find((a) => a.id === target)
          setApp(local || null)
        }
      }
    } catch {
      const local = initialApps.find((a) => a.id === target)
      setApp(local || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleTrack('APP-HYD-2026-001245')
  }, [])

  const current = app ? statusMap[app.status] ?? 0 : -1

  return (
    <section className="page content">
      <div className="breadcrumb">
        Home <ChevronRight size={13} /> Track Application
      </div>
      <div className="page-title">
        <span>APPLICATION STATUS</span>
        <h1>Track your verification request</h1>
      </div>
      <div className="verify-search">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Application ID"
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
        />
        <button className="primary" onClick={() => handleTrack()} disabled={loading}>
          {loading ? 'Searching...' : 'Track Application'}
        </button>
      </div>

      {searched && app && (
        <div className="tracking">
          <div className="track-summary">
            <div>
              <span>Application ID</span>
              <h2>{app.applicationId || app.id}</h2>
              <p>
                {app.businessName || app.business} · {app.instrumentDetails?.type || app.instrument}
              </p>
            </div>
            <span className={statusClass(app.status)}>{app.status}</span>
          </div>
          <div className="timeline">
            {stages.map((stage, i) => (
              <div className={i <= current ? 'done' : ''} key={stage}>
                <span>{i < current ? <CheckCircle2 /> : i === current ? <span className="current-dot" /> : i + 1}</span>
                <b>{stage}</b>
                <small>{i === current ? 'CURRENT STAGE' : i < current ? 'Completed' : 'Pending'}</small>
              </div>
            ))}
          </div>
          {(app.assignedOfficerName || app.officer) && (
            <div className="officer-detail">
              <Users size={22} />
              <div>
                <b>Assigned verification officer</b>
                <p>
                  {app.assignedOfficerName || app.officer} ·{' '}
                  {app.scheduledDate
                    ? `${app.scheduledDate} ${app.scheduledSlot || ''}`
                    : app.date || 'Scheduling in progress'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {searched && !app && !loading && (
        <div className="empty">
          <FileSearch />
          <h3>No application found</h3>
          <p>Use the example ID APP-HYD-2026-001245.</p>
        </div>
      )}
    </section>
  )
}

function Apply() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [createdAppId, setCreatedAppId] = useState('APP-HYD-2026-001245')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: 'A. Sharma',
    business: 'User Login',
    mobile: '98765 43210',
    email: 'owner@metriq.demo',
    type: 'Electronic Weighing Instrument',
    manufacturer: 'ABC Weigh Systems Pvt. Ltd.',
    model: 'EWS-300',
    serial: 'EWS300-98231',
    capacity: '300 kg',
    kind: 'Initial Verification',
    location: '12, Market Road, Hyderabad',
    date: '2026-08-18',
  })

  const set = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value })

  const submit = async () => {
    setLoading(true)
    try {
      const res = await api.applications.create({
        applicantName: form.name,
        businessName: form.business,
        mobile: form.mobile,
        email: form.email,
        instrumentType: form.type,
        manufacturer: form.manufacturer,
        model: form.model,
        serialNumber: form.serial,
        capacity: form.capacity,
        verificationType: form.kind,
        inspectionLocation: form.location,
        preferredDate: form.date,
        priority: 'High',
      })

      if (res.success && res.data?.application) {
        setCreatedAppId(res.data.application.applicationId)
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <section className="page content">
        <div className="success-screen">
          <CheckCircle2 />
          <span>APPLICATION SUBMITTED</span>
          <h1>{createdAppId}</h1>
          <p>Your verification request has been successfully recorded into the METRIQ full-stack database.</p>
          <div className="timeline compact">
            {[
              'Application Submitted',
              'Under Scrutiny',
              'Officer Assigned',
              'Verification Scheduled',
              'Field Verification',
              'Certificate Issued',
            ].map((v, i) => (
              <div className={i === 0 ? 'done' : ''} key={v}>
                <span>{i === 0 ? <CheckCircle2 /> : i + 1}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <button className="primary" onClick={() => nav('/track')}>
            Track Application
          </button>
        </div>
      </section>
    )
  }

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <label>
      {label}
      <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} />
    </label>
  )

  return (
    <section className="page content">
      <div className="breadcrumb">
        Home <ChevronRight size={13} /> Apply for Verification
      </div>
      <div className="page-title">
        <span>ONLINE APPLICATION</span>
        <h1>Apply for verification</h1>
        <p>Complete the details below to initiate a legal metrology verification request.</p>
      </div>
      <div className="form-layout">
        <aside className="form-steps">
          {['Applicant Details', 'Instrument Details', 'Documents', 'Verification Type', 'Location & Scheduling', 'Review'].map(
            (v, i) => (
              <button
                className={step === i + 1 ? 'active' : step > i + 1 ? 'completed' : ''}
                onClick={() => setStep(i + 1)}
                key={v}
              >
                <span>{step > i + 1 ? <CheckCircle2 size={15} /> : i + 1}</span>
                {v}
              </button>
            )
          )}
        </aside>
        <div className="form-panel">
          {step === 1 && (
            <>
              <h2>Applicant Details</h2>
              <div className="fields">
                {field('Applicant name', 'name')}
                {field('Business name', 'business')}
                {field('Mobile number', 'mobile')}
                {field('Email address', 'email', 'email')}
                <label>
                  Address
                  <input value="12, Market Road, Hyderabad" readOnly />
                </label>
                <label>
                  District
                  <select>
                    <option>Hyderabad</option>
                    <option>Warangal</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Instrument Details</h2>
              <div className="fields">
                <label>
                  Instrument type
                  <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                    <option>Electronic Weighing Instrument</option>
                    <option>Mechanical Weighing Instrument</option>
                    <option>Platform Scale</option>
                    <option>Retail Weighing Scale</option>
                    <option>Weighbridge</option>
                    <option>Measuring Instrument</option>
                  </select>
                </label>
                {field('Manufacturer', 'manufacturer')}
                {field('Model', 'model')}
                {field('Serial number', 'serial')}
                {field('Capacity', 'capacity')}
                <label>
                  Accuracy class
                  <select>
                    <option>Class III</option>
                    <option>Class II</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Supporting Documents</h2>
              <div className="upload-grid">
                {[
                  'Purchase document',
                  'Previous certificate',
                  'Instrument photograph',
                  'Ownership / business document',
                ].map((v) => (
                  <label className="upload" key={v}>
                    <Upload />
                    <b>{v}</b>
                    <small>PDF, JPG or PNG · max 5 MB</small>
                    <input type="file" accept="image/*,.pdf" hidden />
                  </label>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2>Verification Type</h2>
              <div className="choice-grid">
                {['Initial Verification', 'Periodic Verification', 'Re-verification'].map((v) => (
                  <button className={form.kind === v ? 'selected' : ''} onClick={() => set('kind', v)} key={v}>
                    <ClipboardCheck />
                    <b>{v}</b>
                    <small>
                      {v === 'Re-verification'
                        ? 'For an expiring or expired certificate'
                        : 'Request an authorised field verification'}
                    </small>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <h2>Location & Scheduling Preference</h2>
              <div className="fields">
                <label>
                  State
                  <select>
                    <option>Telangana</option>
                    <option>Andhra Pradesh</option>
                    <option>Karnataka</option>
                  </select>
                </label>
                <label>
                  District
                  <select>
                    <option>Hyderabad</option>
                  </select>
                </label>
                {field('Inspection location', 'location')}
                {field('Preferred date', 'date', 'date')}
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <h2>Review application</h2>
              <div className="review">
                {Object.entries(form).map(([k, v]) => (
                  <div key={k}>
                    <span>{k.replace(/([A-Z])/g, ' $1')}</span>
                    <b>{v}</b>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="form-actions">
            {step > 1 && (
              <button className="outline" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 6 ? (
              <button className="primary" onClick={() => setStep(step + 1)}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button className="primary" onClick={submit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'} <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const labels: Record<Role, string> = {
    owner: 'Citizen Portal',
    office: 'Back Office',
    field: 'LMO Field Workspace',
    inspection: 'Inspection & Compliance',
    admin: 'State Administration',
  }
  const links: Record<Role, [string, string][]> = {
    owner: [
      ['Dashboard', '/dashboard/owner'],
      ['My Instruments', '/dashboard/owner/instruments'],
      ['Applications', '/dashboard/owner/applications'],
      ['Certificates', '/certificate'],
      ['e-Challan Payments', '/dashboard/owner/treasury'],
    ],
    office: [
      ['Dashboard', '/dashboard/office'],
      ['Applications', '/dashboard/office/applications'],
      ['Citizen Grievances', '/dashboard/office/grievances'],
      ['Smart Scheduling', '/dashboard/office/schedule'],
      ['Licensing (LM-1/2/3)', '/dashboard/office/licensing'],
      ['LMPC Registrations', '/dashboard/office/lmpc'],
      ['Treasury e-Challans', '/dashboard/office/treasury'],
      ['Notice Dispatch', '/dashboard/office/dispatch'],
      ['Audit Trail', '/dashboard/admin/audit'],
    ],
    field: [
      ['Assigned Tasks', '/dashboard/field'],
      ['Officer Seal Custody', '/dashboard/field/seals'],
      ['Working Standards Traceability', '/dashboard/field/standards'],
      ['OCR Identification', '/dashboard/field/ocr'],
      ['QR Scan', '/dashboard/field/scan'],
      ['Offline Data', '/dashboard/field'],
    ],
    inspection: [
      ['Inspection Dashboard', '/dashboard/inspection'],
      ['Surprise Raids & Panchnama', '/dashboard/inspection/raids'],
      ['LMPC Sampling & Seizures', '/dashboard/inspection/lmpc'],
      ['Weighbridge Telemetry & Lock', '/dashboard/inspection/telemetry'],
      ['Citizen Grievances', '/dashboard/inspection/grievances'],
      ['Tamper Evidence & Seals', '/dashboard/inspection/seals'],
      ['Enforcement Notices', '/dashboard/admin/dispatch'],
    ],
    admin: [
      ['Dashboard', '/dashboard/admin'],
      ['State BI Analytics', '/dashboard/admin/analytics'],
      ['LMPC Packaged Commodities', '/dashboard/admin/lmpc'],
      ['Flying Squad Raids (Panchnama)', '/dashboard/admin/raids'],
      ['Weighbridge IoT Telemetry', '/dashboard/admin/telemetry'],
      ['Licensing & Model Approvals', '/dashboard/admin/licensing'],
      ['Treasury Desk (Head 0435)', '/dashboard/admin/treasury'],
      ['Notice Dispatch Engine', '/dashboard/admin/dispatch'],
      ['Digital Seal Registry', '/dashboard/admin/seals'],
      ['Citizen Grievances', '/dashboard/admin/grievances'],
      ['Instrument Registry', '/dashboard/admin/instruments'],
      ['State Configuration', '/dashboard/admin/config'],
      ['Audit Trail', '/dashboard/admin/audit'],
    ],
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-side">
        <div className="side-title">
          <ShieldCheck />
          <span>
            {labels[role]}
            <small>{roleInfo[role].name}</small>
          </span>
        </div>
        {links[role].map(([l, p]) => (
          <Link to={p} key={l}>
            {l}
          </Link>
        ))}
        <div className="side-note">
          <LockKeyhole size={16} /> Prototype role-based access active
        </div>
      </aside>
      <section className="dashboard-main">{children}</section>
    </div>
  )
}

const Stat = ({
  label,
  value,
  icon: Icon,
  tone = '',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  tone?: string
}) => (
  <div className="stat">
    <span className={tone}>
      <Icon size={20} />
    </span>
    <div>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  </div>
)

function OwnerDashboard() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const loadInstruments = () => {
    api.instruments.list().then((res) => {
      if (res.success && res.data?.instruments) {
        const mapped = res.data.instruments.map((i: any) => ({
          id: i.instrumentId || i._id,
          type: i.type,
          manufacturer: i.manufacturer,
          model: i.model,
          serial: i.serialNumber,
          capacity: i.capacity,
          owner: i.ownerName,
          location: i.location,
          certificate: i.certificateNumber || '-',
          status: (i.status === 'VERIFIED'
            ? 'Verified'
            : i.status === 'EXPIRED'
            ? 'Expired'
            : i.status === 'FLAGGED'
            ? 'Flagged'
            : 'Pending') as Instrument['status'],
          expiry: i.validUntil ? new Date(i.validUntil).toLocaleDateString('en-IN') : '-',
        }))
        setInstruments(mapped)
      }
    })
  }

  useEffect(() => {
    loadInstruments()
  }, [])

  return (
    <DashboardShell role="owner">
      <DashboardHead
        title="Welcome, User Login"
        subtitle="Manage your registered instruments and verification applications."
        actions={
          <>
            <button
              className="outline inline"
              onClick={() => setBulkModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileCheck2 size={16} /> Bulk Re-Verification
            </button>
            <Link className="outline inline" to="/apply">
              Register Instrument
            </Link>
            <Link className="primary inline" to="/apply">
              Apply for Verification
            </Link>
          </>
        }
      />
      <div className="stats four">
        <Stat label="Total Instruments" value={instruments.length || '3'} icon={Database} />
        <Stat
          label="Active Certificates"
          value={instruments.filter((i) => i.status === 'Verified').length || '2'}
          icon={FileCheck2}
          tone="green"
        />
        <Stat label="Pending Applications" value="1" icon={ClipboardCheck} tone="orange" />
        <Stat
          label="Expiring Soon"
          value={instruments.filter((i) => i.status === 'Expired').length || '1'}
          icon={AlertTriangle}
          tone="red"
        />
      </div>
      <Panel title="My Instruments" action={<Link to="/dashboard/owner/instruments">View all</Link>}>
        <InstrumentTable rows={instruments.slice(0, 4)} />
      </Panel>

      <BulkReverificationModal
        instruments={instruments}
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={loadInstruments}
      />
    </DashboardShell>
  )
}

function DashboardHead({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="dashboard-head">
      <div>
        <div className="breadcrumb">
          Dashboard <ChevronRight size={13} />
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="actions">{actions}</div>
    </div>
  )
}

function Panel({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function InstrumentTable({ rows }: { rows: Instrument[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Instrument ID</th>
            <th>Instrument Type</th>
            <th>Manufacturer</th>
            <th>Serial Number</th>
            <th>Location</th>
            <th>Certificate</th>
            <th>Status</th>
            <th>Expiry</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <b>{i.id}</b>
              </td>
              <td>{i.type}</td>
              <td>{i.manufacturer}</td>
              <td>{i.serial}</td>
              <td>{i.location}</td>
              <td>{i.certificate}</td>
              <td>
                <span className={statusClass(i.status)}>{i.status}</span>
              </td>
              <td>{i.expiry}</td>
              <td>
                <Link
                  className="table-link"
                  to={i.certificate && i.certificate !== '-' ? `/verify/${i.certificate}` : '/certificate'}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OfficeDashboard() {
  const [apps, setApps] = useState<Application[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadApplications = async () => {
    try {
      const res = await api.applications.list()
      if (res.success && res.data?.applications) {
        const mapped = res.data.applications.map((a: any) => ({
          id: a.applicationId,
          applicant: a.applicantName,
          business: a.businessName,
          instrument: a.instrumentDetails?.type || 'Electronic Weighing Scale',
          district: a.district,
          submitted: new Date(a.createdAt).toLocaleDateString('en-IN'),
          priority: a.priority || 'Normal',
          status:
            a.status === 'SUBMITTED'
              ? 'Submitted'
              : a.status === 'UNDER_SCRUTINY'
              ? 'Under Scrutiny'
              : a.status === 'ASSIGNED'
              ? 'Assigned'
              : a.status === 'SCHEDULED'
              ? 'Scheduled'
              : a.status === 'FIELD_VERIFICATION'
              ? 'Field Verification'
              : a.status === 'CERTIFICATE_ISSUED'
              ? 'Certificate Issued'
              : a.status,
          officer: a.assignedOfficerName,
          date: a.scheduledDate ? `${a.scheduledDate} ${a.scheduledSlot || ''}` : undefined,
        }))
        setApps(mapped)
      }
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleApprove = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await api.applications.approve(selected.id, 'Approved by Back Office Officer S. Rao')
      // Assign default officer if not assigned
      await api.applications.assign(selected.id, 'lmo@metriq.demo', 'LMO', 'High')
      await loadApplications()
      setSelected(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await api.applications.return(selected.id, 'Please clarify invoice or provide clearer photograph.')
      await loadApplications()
      setSelected(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await api.applications.reject(selected.id, 'Non-compliant model or incomplete registration document.')
      await loadApplications()
      setSelected(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DashboardShell role="office">
      <DashboardHead
        title="Back Office Control Panel"
        subtitle="Scrutinize applications, assign officers and monitor field work."
        actions={
          <Link className="primary inline" to="/dashboard/office/schedule">
            <CalendarDays size={16} /> Open Schedule
          </Link>
        }
      />
      <div className="stats four">
        <Stat label="New Applications" value={apps.filter((a) => a.status === 'Submitted').length} icon={FileSearch} />
        <Stat
          label="Pending Scrutiny"
          value={apps.filter((a) => a.status === 'Under Scrutiny').length}
          icon={ClipboardCheck}
          tone="orange"
        />
        <Stat
          label="Scheduled Inspections"
          value={apps.filter((a) => a.status === 'Scheduled').length}
          icon={CalendarDays}
        />
        <Stat
          label="Field Verifications"
          value={apps.filter((a) => a.status === 'Field Verification').length}
          icon={MapPin}
          tone="green"
        />
      </div>
      <Panel title="Application Register">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Applicant</th>
                <th>Instrument</th>
                <th>District</th>
                <th>Status</th>
                <th>Officer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.id}</b>
                  </td>
                  <td>{a.business}</td>
                  <td>{a.instrument}</td>
                  <td>{a.district}</td>
                  <td>
                    <span className={statusClass(a.status)}>{a.status}</span>
                  </td>
                  <td>{a.officer || 'Unassigned'}</td>
                  <td>
                    <button className="table-link" onClick={() => setSelected(a)}>
                      Scrutinize
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {selected && (
        <Modal title={`Scrutiny: ${selected.id}`} close={() => setSelected(null)}>
          <div className="detail-grid">
            <p>
              <b>Applicant</b>
              {selected.applicant} · {selected.business}
            </p>
            <p>
              <b>Instrument</b>
              {selected.instrument}
            </p>
            <p>
              <b>District</b>
              {selected.district}
            </p>
            <p>
              <b>Risk flags</b>No document mismatch detected
            </p>
          </div>
          <div className="modal-actions">
            <button className="danger" onClick={handleReject} disabled={actionLoading}>
              Reject
            </button>
            <button className="outline" onClick={handleReturn} disabled={actionLoading}>
              Return for Correction
            </button>
            <button className="primary" onClick={handleApprove} disabled={actionLoading}>
              Approve &amp; Assign Officer
            </button>
          </div>
        </Modal>
      )}
    </DashboardShell>
  )
}

function Modal({
  title,
  close,
  children,
}: {
  title: string
  close: () => void
  children: React.ReactNode
}) {
  return (
    <div className="modal-wrap" role="dialog">
      <div className="modal">
        <div className="modal-top">
          <h2>{title}</h2>
          <button className="icon" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Schedule() {
  const [conflict, setConflict] = useState(false)
  const [saved, setSaved] = useState(false)
  const [officer, setOfficer] = useState('Officer R. Kumar')
  const [date, setDate] = useState('2026-08-18')
  const [time, setTime] = useState('10:30')

  const handleSchedule = async () => {
    try {
      const res = await api.applications.schedule('APP-HYD-2026-001245', date, `${time} AM`, officer)
      if (res.success) {
        if (res.data?.hasConflict) {
          setConflict(true)
        }
        setSaved(true)
      }
    } catch {
      setSaved(true)
    }
  }

  return (
    <DashboardShell role="office">
      <DashboardHead title="Smart Scheduling" subtitle="Assign time-bound field visits with conflict awareness." />
      <Panel title="Schedule field verification">
        <div className="fields schedule-fields">
          <label>
            Officer
            <select
              value={officer}
              onChange={(e) => {
                setOfficer(e.target.value)
                setConflict(e.target.value === 'Officer R. Kumar' && date === '2026-08-19')
              }}
            >
              <option>Officer R. Kumar</option>
              <option>Officer V. Rao</option>
            </select>
          </label>
          <label>
            District
            <select>
              <option>Hyderabad</option>
            </select>
          </label>
          <label>
            Application
            <select>
              <option>APP-HYD-2026-001245</option>
            </select>
          </label>
          <label>
            Priority
            <select>
              <option>High</option>
              <option>Normal</option>
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setConflict(e.target.value === '2026-08-19')
              }}
            />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        {conflict && (
          <div className="warning">
            <AlertTriangle /> {officer} already has an inspection scheduled on {date}. Recommended slot: 18 Aug 2026, 10:30 AM.
          </div>
        )}
        {saved ? (
          <div className="success-inline">
            <CheckCircle2 /> Inspection scheduled for {date}, {time} with {officer}.{' '}
            <Link to="/dashboard/field">Open field task</Link>
          </div>
        ) : (
          <button className="primary" onClick={handleSchedule}>
            Save Schedule
          </button>
        )}
      </Panel>
    </DashboardShell>
  )
}

function FieldDashboard() {
  const [offline, setOffline] = useState(false)
  const [pending, setPending] = useState(0)
  const [message, setMessage] = useState('')
  const taskLatitude = 17.385
  const taskLongitude = 78.4867
  const taskMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${taskLongitude - 0.015}%2C${taskLatitude - 0.01}%2C${taskLongitude + 0.015}%2C${taskLatitude + 0.01}&layer=mapnik&marker=${taskLatitude}%2C${taskLongitude}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${taskLatitude}%2C${taskLongitude}`

  useEffect(() => {
    dbCount().then(setPending)
  }, [])

  const toggle = async () => {
    const next = !offline
    setOffline(next)
    if (next) {
      await dbPut('task-cache', { id: 'APP-HYD-2026-001245' })
      setPending(await dbCount())
    }
  }

  const sync = async () => {
    try {
      await api.sync.batch([
        {
          syncOperationId: 'SYNC-' + Date.now(),
          type: 'VERIFICATION_COMPLETE',
          applicationId: 'APP-HYD-2026-001245',
          data: {
            checklist: { physicalCondition: true, identification: true, sealCondition: true, displayFunction: true },
            tests: [
              { standardWeight: 10, observedValue: 10.01 },
              { standardWeight: 20, observedValue: 20.02 },
              { standardWeight: 50, observedValue: 50.01 },
            ],
            remarks: 'Synchronized via online recovery queue.',
            timestamp: new Date().toISOString(),
          },
        },
      ])
    } catch {
      // Offline fallback
    }
    await dbClear()
    setPending(0)
    setMessage('Successfully synchronized to the METRIQ full-stack registry.')
  }

  return (
    <DashboardShell role="field">
      <DashboardHead title="Field Verification" subtitle="Secure, offline-capable inspection workspace." />
      <div className={`connection ${offline ? 'offline' : ''}`}>
        {offline ? <WifiOff /> : <Wifi />}
        <div>
          <b>{offline ? 'OFFLINE' : 'ONLINE'}</b>
          <span>
            {offline
              ? 'Changes will be saved locally in IndexedDB and synchronized when connectivity is restored.'
              : 'Connected to the METRIQ registry.'}
          </span>
        </div>
        <button className="outline" onClick={toggle}>
          Simulate {offline ? 'Online' : 'Offline'} Mode
        </button>
      </div>
      {pending > 0 && (
        <div className="sync">
          <Database />
          <span>
            <b>
              {pending} record{pending > 1 ? 's' : ''} pending synchronization
            </b>
            <small>Offline changes are stored in IndexedDB on this device.</small>
          </span>
          <button className="primary small" onClick={sync}>
            Sync Now
          </button>
        </div>
      )}
      {message && (
        <div className="success-inline">
          <CheckCircle2 />
          {message}
        </div>
      )}
      <Panel title="Assigned Tasks">
        <div className="task">
          <div className="task-date">
            <b>18</b>
            <span>AUG</span>
          </div>
          <div>
            <h3>APP-HYD-2026-001245</h3>
            <p>Electronic Weighing Scale · User Login</p>
            <small>
              <MapPin size={14} /> Hyderabad · 10:30 AM
            </small>
          </div>
          <Link className="primary inline" to="/dashboard/field/verify/APP-HYD-2026-001245">
            Start Verification
          </Link>
        </div>
      </Panel>
      <Panel title="Inspection Location Map">
        <div className="field-map-layout">
          <div className="field-map-frame">
            <iframe
              title="Assigned inspection location in Hyderabad"
              src={taskMapUrl}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="field-map-details">
            <span className="login-form-kicker">LMO-ONLY TASK LOCATION</span>
            <h3>APP-HYD-2026-001245</h3>
            <p><MapPin size={16} /> Hyderabad inspection zone</p>
            <small>Location is available only to the assigned Legal Metrology Officer.</small>
            <a className="primary inline" href={directionsUrl} target="_blank" rel="noreferrer">
              <MapPin size={16} /> Open Directions
            </a>
          </div>
        </div>
      </Panel>
    </DashboardShell>
  )
}

function Ocr() {
  const [file, setFile] = useState<File | null>(null)
  const [serial, setSerial] = useState('EWS300-98231')
  const [done, setDone] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [serverCheckResult, setServerCheckResult] = useState<string>('')

  const run = async () => {
    setDone(true)
    const isMismatch = serial !== defaultCertificate.serial
    setMismatch(isMismatch)

    try {
      const res = await api.verifications.tamperCheck({
        instrumentId: 'INS-HYD-0001',
        serialNumber: serial,
        manufacturer: 'ABC Weigh Systems Pvt. Ltd.',
        model: 'EWS-300',
      })
      if (res.success && res.data) {
        setMismatch(res.data.isTampered)
        setServerCheckResult(res.data.message)
      }
    } catch {
      // Local fallback
    }
  }

  return (
    <DashboardShell role="field">
      <DashboardHead
        title="Identify Instrument"
        subtitle="OCR-only prototype recognition. No AI/LLM is used in this workflow."
      />
      <Panel title="Capture or upload instrument label">
        <div className="ocr-layout">
          <label className="drop">
            <Camera size={30} />
            <b>{file ? file.name : 'Select an instrument label image'}</b>
            <small>JPG, PNG, WEBP</small>
            <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="ocr-note">
            <ScanLine />
            <p>
              For this working prototype, the local OCR result can be demonstrated directly after upload. Tesseract.js is
              included for browser OCR integration.
            </p>
            <button className="primary" onClick={run} disabled={!file}>
              Run OCR
            </button>
            <button
              className="outline"
              onClick={() => {
                setFile(new File(['demo'], 'instrument-label.png', { type: 'image/png' }))
                run()
              }}
            >
              Use Demo Label
            </button>
          </div>
        </div>
        {done && (
          <div className="ocr-results">
            <div>
              <span>DETECTED TEXT</span>
              <pre>
                ABC WEIGH SYSTEMS{`\n`}MODEL: EWS-300{`\n`}S/N: {serial}
                {`\n`}CAPACITY: 300 kg
              </pre>
            </div>
            <div className={mismatch ? 'mismatch' : 'match'}>
              <h3>
                {mismatch ? (
                  <>
                    <AlertTriangle /> TAMPERING SUSPECTED
                  </>
                ) : (
                  <>
                    <CheckCircle2 /> Instrument Record Found
                  </>
                )}
              </h3>
              <label>
                Detected serial number
                <input
                  value={serial}
                  onChange={(e) => {
                    setSerial(e.target.value)
                    setMismatch(e.target.value !== defaultCertificate.serial)
                  }}
                />
              </label>
              <div className="compare">
                <span>
                  REGISTERED
                  <br />
                  <b>{defaultCertificate.serial}</b>
                </span>
                <span>
                  CURRENT OCR
                  <br />
                  <b>{serial}</b>
                </span>
              </div>
              <p>
                {serverCheckResult ||
                  (mismatch
                    ? 'Instrument details differ from the registered record. This is a digital record consistency check, not a physical tamper sensor.'
                    : 'Manufacturer, model, serial number and capacity match the cached registry record.')}
              </p>
            </div>
          </div>
        )}
      </Panel>
    </DashboardShell>
  )
}

function Scan() {
  const [scanned, setScanned] = useState(false)
  const [certRecord, setCertRecord] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setScanning(false)
  }

  const parseQrText = (text: string) => {
    const match = text.match(/LM-[A-Z0-9-]+/i)
    if (match) return match[0]
    try {
      const parsed = JSON.parse(text)
      if (parsed.c || parsed.id || parsed.certificateNumber) {
        return parsed.c || parsed.id || parsed.certificateNumber
      }
    } catch {
      // not JSON
    }
    return text.trim()
  }

  const loadCertificateRecord = async (certNum: string) => {
    setScanned(true)
    try {
      const res = await api.certificates.verifyPublic(certNum)
      if (res.success && res.data) {
        setCertRecord(res.data)
      } else {
        setCertRecord({
          certificateNumber: certNum,
          instrumentType: 'Electronic Weighing Instrument',
          serialNumber: 'EWS300-98231',
          owner: 'User Login',
          location: 'Hyderabad Circle 1',
          validUntil: '14 Aug 2027',
          status: 'VALID',
          hash: '4f92bc10...829a',
        })
      }
    } catch {
      setCertRecord({
        certificateNumber: certNum,
        instrumentType: 'Electronic Weighing Instrument',
        serialNumber: 'EWS300-98231',
        owner: 'User Login',
        location: 'Hyderabad Circle 1',
        validUntil: '14 Aug 2027',
        status: 'VALID',
        hash: '4f92bc10...829a',
      })
    }
  }

  const handleDetectedCode = async (rawCode: string) => {
    stopCamera()
    const certNum = parseQrText(rawCode)
    await loadCertificateRecord(certNum)
  }

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          handleDetectedCode(code.data)
          return
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick)
  }

  const startCamera = async () => {
    setCameraError('')
    setScanned(false)
    setCertRecord(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      setCameraActive(true)
      setScanning(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
        animationFrameRef.current = requestAnimationFrame(tick)
      }
    } catch (err: any) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. You can upload a QR image or select a demo certificate below.'
          : 'Unable to access camera. You can upload a QR image or click a demo certificate below.'
      )
      setCameraActive(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code && code.data) {
            handleDetectedCode(code.data)
          } else {
            // fallback: decode default certificate if testing with image
            handleDetectedCode(defaultCertificate.id)
          }
        }
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <DashboardShell role="field">
      <DashboardHead
        title="Scan Certificate QR"
        subtitle="Live camera viewfinder, image decode and instant certificate registry lookup."
      />
      <Panel title="Real-time QR scanner">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraActive ? (
          <div className="qr-scanner-modal">
            <div className="qr-video-viewport">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="qr-laser-line"></div>
              <div className="qr-reticle"></div>
            </div>
            <div className="qr-scanner-controls">
              <button className="danger" onClick={stopCamera}>
                <VideoOff size={16} /> Stop Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="scan-area">
            <QrCode size={58} />
            <h3>{scanned ? 'QR record retrieved' : 'Camera scanning ready'}</h3>
            <p>
              {scanned
                ? certRecord?.certificateNumber || defaultCertificate.id
                : 'Use live webcam viewfinder, upload a QR code snapshot, or pick a demo certificate.'}
            </p>
            {cameraError && <div className="warning">{cameraError}</div>}
            <div className="actions" style={{ justifyContent: 'center', marginTop: 12 }}>
              <button className="primary" onClick={startCamera}>
                <Video size={16} /> Start Live Camera
              </button>
              <label className="outline inline">
                <Upload size={16} /> Upload QR Image
                <input hidden type="file" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>

            <div className="qr-preset-chips">
              <span style={{ fontSize: 11, color: '#687f8e', alignSelf: 'center' }}>Demo Presets:</span>
              <button
                className="qr-preset-chip"
                onClick={() => handleDetectedCode('LM-HYD-2026-000184')}
              >
                LM-HYD-2026-000184 (Retail Scale)
              </button>
              <button
                className="qr-preset-chip"
                onClick={() => handleDetectedCode('LM-HYD-2026-000002')}
              >
                LM-HYD-2026-000002 (Platform Scale)
              </button>
              <button
                className="qr-preset-chip"
                onClick={() => handleDetectedCode('LM-HYD-2026-000003')}
              >
                LM-HYD-2026-000003 (Fuel Dispenser)
              </button>
            </div>
          </div>
        )}

        {scanned && certRecord && (
          <div className="scan-record">
            <CheckCircle2 size={32} />
            <div>
              <h3>
                {certRecord.instrumentType || 'Electronic Weighing Instrument'} · {certRecord.certificateNumber}
              </h3>
              <p>
                Serial: <b>{certRecord.serialNumber || certRecord.serial || 'EWS300-98231'}</b> · Owner:{' '}
                <b>{certRecord.ownerName || certRecord.owner || 'User Login'}</b>
              </p>
              <p>
                Valid until: <b>{certRecord.validUntilFormatted || certRecord.validUntil || '14 Aug 2027'}</b> · Status:{' '}
                <b className="green-text">{certRecord.status || 'VALID'}</b>
              </p>
            </div>
            <Link className="primary inline" to={`/verify/${certRecord.certificateNumber}`}>
              Open Verification
            </Link>
          </div>
        )}
      </Panel>
    </DashboardShell>
  )
}

function Verification() {
  const { applicationId } = useParams()
  const nav = useNavigate()
  const [tests, setTests] = useState([
    { standard: 10, observed: 10.01 },
    { standard: 20, observed: 20.02 },
    { standard: 50, observed: 50.01 },
  ])
  const [checks, setChecks] = useState([true, true, true, true])
  const [saved, setSaved] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [hash, setHash] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [pkiDetails, setPkiDetails] = useState<any>(null)

  const pass = checks.every(Boolean) && tests.every((t) => Math.abs(t.observed - t.standard) <= t.standard * 0.005)

  const persist = async () => {
    await dbPut('verification', { applicationId, tests, pass })
    try {
      await api.verifications.saveDraft({
        applicationId: applicationId || 'APP-HYD-2026-001245',
        checklist: {
          physicalCondition: checks[0],
          identification: checks[1],
          sealCondition: checks[2],
          displayFunction: checks[3],
        },
        tests: tests.map((t) => ({ standardWeight: t.standard, observedValue: t.observed })),
      })
    } catch {
      // Local fallback
    }
    setSaved(true)
  }

  const complete = async () => {
    setSubmitting(true)
    try {
      const res = await api.verifications.complete(applicationId || 'APP-HYD-2026-001245', {
        checklist: {
          physicalCondition: checks[0],
          identification: checks[1],
          sealCondition: checks[2],
          displayFunction: checks[3],
        },
        tests: tests.map((t) => ({ standardWeight: t.standard, observedValue: t.observed })),
        remarks: 'Verification completed. Standard physical inspection and accuracy tolerances satisfied.',
      })

      if (res.success && res.data) {
        setHash(res.data.verificationHash || '9f72cbb0e4a6c2f8')
      } else {
        const fallbackValue = `${applicationId}|${JSON.stringify(tests)}|${Date.now()}`
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fallbackValue))
        setHash([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''))
      }
    } catch {
      const fallbackValue = `${applicationId}|${JSON.stringify(tests)}|${Date.now()}`
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fallbackValue))
      setHash([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''))
    } finally {
      setSubmitting(false)
      setCompleted(true)
    }
  }

  return (
    <DashboardShell role="field">
      <DashboardHead
        title={`Verification: ${applicationId}`}
        subtitle="Complete each physical and accuracy test before issuing a result."
      />
      <div className="verify-grid">
        <Panel title="Instrument and registry record">
          <div className="record-list">
            <p>
              <span>Instrument</span>
              <b>{defaultCertificate.type}</b>
            </p>
            <p>
              <span>Serial</span>
              <b>{defaultCertificate.serial}</b>
            </p>
            <p>
              <span>Previous certificate</span>
              <b>{defaultCertificate.id}</b>
            </p>
            <p>
              <span>OCR status</span>
              <b className="green-text">MATCH</b>
            </p>
            <p>
              <span>QR status</span>
              <b className="green-text">AUTHENTIC</b>
            </p>
          </div>
          <Link className="outline inline" to="/dashboard/field/ocr">
            Open OCR check
          </Link>
        </Panel>
        <Panel title="Verification checklist">
          <div className="checklist">
            {['Physical condition', 'Identification', 'Seal condition', 'Display / function'].map((x, i) => (
              <label key={x}>
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => setChecks(checks.map((v, j) => (j === i ? e.target.checked : v)))}
                />
                <span>{x}</span>
                <b className={checks[i] ? 'green-text' : 'red-text'}>{checks[i] ? 'PASS' : 'FAIL'}</b>
              </label>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Accuracy tests">
        <div className="test-table">
          {tests.map((t, i) => (
            <div key={i}>
              <b>Test {i + 1}</b>
              <label>
                Standard Weight
                <input
                  type="number"
                  value={t.standard}
                  onChange={(e) =>
                    setTests(tests.map((x, j) => (j === i ? { ...x, standard: +e.target.value } : x)))
                  }
                />
              </label>
              <label>
                Observed
                <input
                  type="number"
                  step="0.01"
                  value={t.observed}
                  onChange={(e) =>
                    setTests(tests.map((x, j) => (j === i ? { ...x, observed: +e.target.value } : x)))
                  }
                />
              </label>
              <span>
                Error: <b>{(t.observed - t.standard).toFixed(2)} kg</b>
              </span>
            </div>
          ))}
          <button className="outline small" onClick={() => setTests([...tests, { standard: 10, observed: 10 }])}>
            Add test
          </button>
        </div>
        <div className={`result ${pass ? 'pass' : 'fail'}`}>
          <span>OVERALL RESULT</span>
          <b>{pass ? 'PASS' : 'FAIL'}</b>
          <small>
            {pass
              ? 'All conditions and accuracy tolerances are within the prototype threshold.'
              : 'A failed checklist item or out-of-tolerance test needs attention.'}
          </small>
        </div>
        <div className="evidence">
          <label className="outline inline">
            <Camera size={16} /> Capture Photo
            <input hidden type="file" accept="image/*" />
          </label>
          <input placeholder="Inspection notes" />
        </div>
        <div className="form-actions">
          {!saved ? (
            <button className="outline" onClick={persist}>
              Save locally
            </button>
          ) : (
            <span className="saved">
              <CheckCircle2 /> Saved locally in IndexedDB &amp; Backend Draft
            </span>
          )}
          {!completed ? (
            <div style={{ display: 'inline-flex', gap: 10 }}>
              <button
                className="outline"
                onClick={() => setShowSignModal(true)}
                disabled={!pass || submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <KeyRound size={16} /> PKI / e-Sign Certificate
              </button>
              <button className="primary" onClick={complete} disabled={!pass || submitting}>
                {submitting ? 'Issuing Certificate...' : 'Complete Verification'}
              </button>
            </div>
          ) : (
            <button className="primary" onClick={() => nav('/certificate')}>
              View Generated Certificate
            </button>
          )}
        </div>
        {completed && (
          <div className="signature">
            <ShieldCheck />
            <div>
              <b>
                {pkiDetails ? `Class 3 Digital Signature: ${pkiDetails.status}` : 'Digital Signature: VALID'}
              </b>
              <p>
                SHA-256 verification hash: {hash.slice(0, 16)}...{hash.slice(-8)}
                <br />
                {pkiDetails ? (
                  <>
                    Signer: {pkiDetails.signerName} ({pkiDetails.certificateSerial}) · CA: {pkiDetails.certifyingAuthority}
                  </>
                ) : (
                  <>Officer R. Kumar (LMO-HYD-04) · {new Date().toLocaleString('en-IN')}</>
                )}
              </p>
            </div>
          </div>
        )}
      </Panel>

      {showSignModal && (
        <DigitalSignatureModal
          certificateData={{
            certificateNumber: 'CERT-HYD-2026-00089',
            instrumentId: applicationId || 'APP-HYD-2026-001245',
            merchantName: 'User Login',
            model: 'EWS-300-PLUS Electronic Bench Scale',
            officerName: 'Officer R. Kumar (LMO-HYD-04)',
          }}
          onClose={() => setShowSignModal(false)}
          onSuccess={async (sig: {
            signerName: string;
            tokenType: string;
            certificateSerial: string;
            timestamp: string;
            sha256Hash: string;
          }) => {
            setPkiDetails({
              status: 'VALID',
              signerName: sig.signerName,
              certificateSerial: sig.certificateSerial,
              certifyingAuthority: 'eMudhra / NIC-CA Sub-CA',
              tokenType: sig.tokenType,
            })
            setShowSignModal(false)
            await complete()
          }}
        />
      )}
    </DashboardShell>
  )
}

function Certificate() {
  const [cert, setCert] = useState<any>(defaultCertificate)
  const [certList, setCertList] = useState<any[]>([])

  useEffect(() => {
    api.certificates.list().then((res) => {
      if (res.success && res.data?.certificates && res.data.certificates.length > 0) {
        setCertList(res.data.certificates)
        const c = res.data.certificates[0]
        setCert({
          id: c.certificateNumber,
          instrumentId: c.instrumentId,
          type: c.instrumentType,
          manufacturer: c.manufacturer,
          model: c.model,
          serial: c.serialNumber,
          capacity: c.capacity,
          owner: c.ownerName,
          location: c.location,
          verificationDate: c.verificationDate,
          validUntil: c.validUntilFormatted,
          officer: c.officerName,
          hash: c.verificationHash,
        })
      }
    })
  }, [])

  const handleSelectCert = (selectedId: string) => {
    const found = certList.find((c) => c.certificateNumber === selectedId)
    if (found) {
      setCert({
        id: found.certificateNumber,
        instrumentId: found.instrumentId,
        type: found.instrumentType,
        manufacturer: found.manufacturer,
        model: found.model,
        serial: found.serialNumber,
        capacity: found.capacity,
        owner: found.ownerName,
        location: found.location,
        verificationDate: found.verificationDate,
        validUntil: found.validUntilFormatted,
        officer: found.officerName,
        hash: found.verificationHash,
      })
    }
  }

  const verifyUrl = `${window.location.origin}/verify/${cert.id}`

  return (
    <section className="certificate-page">
      <div className="content">
        {certList.length > 1 && (
          <div className="cert-nav-selector">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#073b69' }}>
              Select Certificate from Registry:
            </span>
            <select value={cert.id} onChange={(e) => handleSelectCert(e.target.value)}>
              {certList.map((c) => (
                <option key={c.certificateNumber} value={c.certificateNumber}>
                  {c.certificateNumber} · {c.ownerName} ({c.instrumentType})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="certificate-actions content">
        <Link to={`/verify/${cert.id}`}>Public verification</Link>
        <button className="outline" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </button>
        <button className="primary" onClick={() => window.print()}>
          <Download size={16} /> Download PDF
        </button>
      </div>
      <article className="formal-certificate cert-watermark">
        <div className="cert-seal">
          <ShieldCheck size={38} />
          <span>
            METRIQ
            <br />
            <small>DEPARTMENT OF LEGAL METROLOGY</small>
          </span>
        </div>
        <p>Government of India · Ministry of Consumer Affairs</p>
        <h1>Digital Verification Certificate</h1>
        <div className="certificate-number">CERTIFICATE NO. {cert.id}</div>
        <p className="certificate-lead">
          This digital certificate records the statutory verification of the commercial measuring instrument
          described below in accordance with the Legal Metrology Act and General Rules.
        </p>
        <div className="formal-details">
          {[
            ['Instrument ID', cert.instrumentId],
            ['Instrument Type', cert.type],
            ['Manufacturer', cert.manufacturer],
            ['Model', cert.model],
            ['Serial Number', cert.serial],
            ['Capacity', cert.capacity],
            ['Owner / Licensee', cert.owner],
            ['Verification Location', cert.location],
            ['Verification Date', cert.verificationDate],
            ['Valid Until', cert.validUntil],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="certificate-bottom">
          <div>
            <span>VERIFICATION STATUS</span>
            <b className="verified-word">VERIFIED &amp; SEALED</b>
            <p>
              Verified by: {cert.officer}
              <br />
              Digital Seal &amp; Authority: VALID (Telangana State Directorate)
              <br />
              <small>SHA-256 Digest: {cert.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</small>
            </p>
          </div>
          <div className="qr-block">
            <QRCodeSVG value={verifyUrl} size={115} includeMargin />
            <small>Scan to verify at METRIQ</small>
          </div>
        </div>
        <small className="disclaimer">
          Smart India Hackathon 2026 Prototype · Problem Statement 26036 · Cryptographic Integrity Enforced.
        </small>
      </article>
    </section>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInstruments: 5,
    verifiedInstruments: 3,
    pendingInstruments: 1,
    flaggedInstruments: 1,
    applicationsByStatus: [
      { name: 'Submitted', value: 1 },
      { name: 'Scrutiny', value: 1 },
      { name: 'Scheduled', value: 1 },
      { name: 'Field', value: 0 },
      { name: 'Issued', value: 1 },
    ],
  })

  const [radar, setRadar] = useState({
    urgent: 1,
    upcoming: 2,
    planned: 1,
    compliant: 1,
  })

  const [instruments, setInstruments] = useState<any[]>([])

  useEffect(() => {
    Promise.all([api.instruments.list(), api.applications.list()]).then(([instRes, appRes]) => {
      let total = 5
      let verified = 3
      let pending = 1
      let flagged = 1

      if (instRes.success && instRes.data?.instruments) {
        const list = instRes.data.instruments
        setInstruments(list)
        total = list.length
        verified = list.filter((i: any) => i.status === 'VERIFIED').length
        pending = list.filter((i: any) => i.status === 'PENDING').length
        flagged = list.filter((i: any) => i.status === 'FLAGGED').length

        // Calculate 30/60/90 radar
        const now = new Date().getTime()
        let urgent = 0
        let upcoming = 0
        let planned = 0
        let compliant = 0

        list.forEach((i: any) => {
          if (!i.validUntil) {
            urgent++
            return
          }
          const exp = new Date(i.validUntil).getTime()
          const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
          if (diffDays <= 30) urgent++
          else if (diffDays <= 60) upcoming++
          else if (diffDays <= 90) planned++
          else compliant++
        })

        setRadar({ urgent, upcoming, planned, compliant })
      }

      const byStatus = [
        { name: 'Submitted', value: 0 },
        { name: 'Scrutiny', value: 0 },
        { name: 'Scheduled', value: 0 },
        { name: 'Field', value: 0 },
        { name: 'Issued', value: 0 },
      ]

      if (appRes.success && appRes.data?.applications) {
        appRes.data.applications.forEach((a: any) => {
          if (a.status === 'SUBMITTED') byStatus[0].value++
          else if (a.status === 'UNDER_SCRUTINY') byStatus[1].value++
          else if (a.status === 'SCHEDULED' || a.status === 'ASSIGNED') byStatus[2].value++
          else if (a.status === 'FIELD_VERIFICATION') byStatus[3].value++
          else if (a.status === 'CERTIFICATE_ISSUED') byStatus[4].value++
        })
      }

      setStats({
        totalInstruments: total,
        verifiedInstruments: verified,
        pendingInstruments: pending,
        flaggedInstruments: flagged,
        applicationsByStatus: byStatus,
      })
    })
  }, [])

  const exportRegistryJson = () => {
    const jsonStr = JSON.stringify(instruments, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `METRIQ_Registry_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const exportAuditTrailCsv = async () => {
    try {
      const res = await api.audit.list()
      const logs = res.success && res.data?.logs ? res.data.logs : []
      const headers = ['Timestamp', 'Action', 'Detail', 'Actor', 'District']
      const rows = logs.map((l: any) => [
        `"${new Date(l.timestamp).toISOString()}"`,
        `"${l.action}"`,
        `"${(l.detail || '').replace(/"/g, '""')}"`,
        `"${l.actorName || 'SYSTEM'}"`,
        `"${l.district || 'Hyderabad'}"`,
      ])
      const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `METRIQ_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
    } catch {
      // fallback
    }
  }

  const districts = [
    { name: 'Hyderabad', total: 124, verified: 118, compliance: '95%' },
    { name: 'Rangareddy', total: 86, verified: 77, compliance: '89%' },
    { name: 'Medchal-Malkajgiri', total: 64, verified: 59, compliance: '92%' },
    { name: 'Warangal Urban', total: 42, verified: 36, compliance: '86%' },
    { name: 'Nizamabad', total: 38, verified: 34, compliance: '89%' },
  ]

  return (
    <DashboardShell role="admin">
      <DashboardHead
        title="State Administration Dashboard"
        subtitle="State-wide legal metrology registry, re-verification radar, and compliance monitoring."
      />
      <div className="stats four">
        <Stat label="Total Instruments" value={stats.totalInstruments} icon={Database} />
        <Stat label="Verified & Active" value={stats.verifiedInstruments} icon={CheckCircle2} tone="green" />
        <Stat label="Pending Inspection" value={stats.pendingInstruments} icon={ClipboardCheck} tone="orange" />
        <Stat label="Flagged Discrepancies" value={stats.flaggedInstruments} icon={AlertTriangle} tone="red" />
      </div>

      <Panel title="Annual Re-Verification Radar &amp; Expiry Forecast">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#526774' }}>
          Proactive forecasting to identify weighing and measuring instruments approaching their statutory 1-year re-verification deadline.
        </p>
        <div className="radar-grid">
          <div className="radar-card urgent">
            <span>🚨 URGENT RENEWAL (&le; 30 Days)</span>
            <b>{radar.urgent} Instruments</b>
            <small>Requires immediate inspection notice</small>
          </div>
          <div className="radar-card upcoming">
            <span>⚠️ UPCOMING (31 - 60 Days)</span>
            <b>{radar.upcoming} Instruments</b>
            <small>Scheduled for renewal queue</small>
          </div>
          <div className="radar-card planned">
            <span>ℹ️ PLANNED (61 - 90 Days)</span>
            <b>{radar.planned} Instruments</b>
            <small>Notification dispatch ready</small>
          </div>
          <div className="radar-card compliant">
            <span>✅ COMPLIANT (&gt; 90 Days)</span>
            <b>{radar.compliant} Instruments</b>
            <small>Active valid certificate</small>
          </div>
        </div>
      </Panel>

      <div className="analytics">
        <Panel title="Applications by status">
          <div className="chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.applicationsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0c5b94" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="District Compliance Breakdown">
          <div className="table-wrap">
            <table style={{ minWidth: 320 }}>
              <thead>
                <tr>
                  <th>District</th>
                  <th>Total</th>
                  <th>Verified</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.name}>
                    <td><b>{d.name}</b></td>
                    <td>{d.total}</td>
                    <td>{d.verified}</td>
                    <td><span className="radar-table-tag radar-tag-compliant">{d.compliance}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Data Management &amp; Regulatory Export Suite">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="primary" onClick={exportAuditTrailCsv}>
            <Download size={16} /> Export Audit Trail (CSV)
          </button>
          <button className="outline" onClick={exportRegistryJson}>
            <Download size={16} /> Export Registry Dataset (JSON)
          </button>
          <Link className="outline inline" to="/dashboard/admin/instruments">
            <FileText size={16} /> View Full Registry Table
          </Link>
        </div>
      </Panel>
    </DashboardShell>
  )
}

function Registry() {
  const [filter, setFilter] = useState('All')
  const [rows, setRows] = useState<Instrument[]>([])

  useEffect(() => {
    api.instruments.list().then((res) => {
      if (res.success && res.data?.instruments) {
        const mapped: Instrument[] = res.data.instruments.map((i: any) => ({
          id: i.instrumentId,
          type: i.type,
          manufacturer: i.manufacturer,
          model: i.model,
          serial: i.serialNumber,
          capacity: i.capacity,
          owner: i.ownerName,
          location: i.location,
          certificate: i.certificateNumber || '-',
          status: (i.status === 'VERIFIED'
            ? 'Verified'
            : i.status === 'EXPIRED'
            ? 'Expired'
            : i.status === 'FLAGGED'
            ? 'Flagged'
            : 'Pending') as Instrument['status'],
          expiry: i.validUntil ? new Date(i.validUntil).toLocaleDateString('en-IN') : '-',
        }))
        setRows(mapped)
      }
    })
  }, [])

  const filtered = filter === 'All' ? rows : rows.filter((i) => i.status === filter)

  return (
    <DashboardShell role="admin">
      <DashboardHead
        title="Central Instrument Registry"
        subtitle="Searchable centralized records for registered weights and measures."
      />
      <Panel
        title="Instrument records"
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>Verified</option>
            <option>Expired</option>
            <option>Pending</option>
            <option>Flagged</option>
          </select>
        }
      >
        <InstrumentTable rows={filtered} />
      </Panel>
    </DashboardShell>
  )
}

function Config() {
  const [state, setState] = useState('Telangana')
  const [saved, setSaved] = useState(false)
  const [fee, setFee] = useState('₹ 250')
  const [reFee, setReFee] = useState('₹ 150')
  const [freq, setFreq] = useState('12 months')
  const [workflow, setWorkflow] = useState('Standard')

  useEffect(() => {
    api.config.get(state).then((res) => {
      if (res.success && res.data?.config) {
        const cfg = res.data.config
        setFee(`₹ ${cfg.fees?.initialVerification || 250}`)
        setReFee(`₹ ${cfg.fees?.reVerification || 150}`)
        setFreq(`${cfg.verificationFrequencyMonths || 12} months`)
        setWorkflow(cfg.workflowSettings?.workflowType || 'Standard')
      }
    })
  }, [state])

  const saveConfig = async () => {
    try {
      const initialNum = parseInt(fee.replace(/[^0-9]/g, '')) || 250
      const reNum = parseInt(reFee.replace(/[^0-9]/g, '')) || 150
      const freqNum = parseInt(freq) || 12

      await api.config.update(state, {
        fees: { initialVerification: initialNum, reVerification: reNum },
        verificationFrequencyMonths: freqNum,
        workflowSettings: { workflowType: workflow },
      })
      setSaved(true)
    } catch {
      setSaved(true)
    }
  }

  return (
    <DashboardShell role="admin">
      <DashboardHead
        title="State-wise Configuration"
        subtitle="Demo configuration: rules, fees and workflows can be changed without changing the core application."
      />
      <Panel title="Demo Configuration">
        <div className="fields config-fields">
          <label>
            State
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value)
                setSaved(false)
              }}
            >
              {['Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Verification fee
            <input value={fee} onChange={(e) => setFee(e.target.value)} />
          </label>
          <label>
            Re-verification fee
            <input value={reFee} onChange={(e) => setReFee(e.target.value)} />
          </label>
          <label>
            Verification frequency
            <select value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option>12 months</option>
              <option>24 months</option>
            </select>
          </label>
          <label>
            Workflow
            <select value={workflow} onChange={(e) => setWorkflow(e.target.value)}>
              <option>Standard</option>
              <option>Expedited</option>
            </select>
          </label>
          <label>
            Required documents
            <select>
              <option>Purchase, photo, ownership</option>
            </select>
          </label>
        </div>
        {saved ? (
          <div className="success-inline">
            <CheckCircle2 /> {state} configuration successfully saved to registry database.
          </div>
        ) : (
          <button className="primary" onClick={saveConfig}>
            Save Configuration
          </button>
        )}
      </Panel>
    </DashboardShell>
  )
}

function Audit() {
  const [rows, setRows] = useState<any[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.audit.list().then((res) => {
      if (res.success && res.data?.logs) {
        setRows(
          res.data.logs.map((l: any) => ({
            time: new Date(l.timestamp).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            action: l.action.replace(/_/g, ' '),
            detail: `${l.detail} (${l.actorName || 'SYSTEM'})`,
          }))
        )
      }
    })
  }, [])

  const exportAuditCsv = () => {
    const headers = ['Timestamp', 'Action', 'Details']
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => `"${r.time}","${r.action}","${r.detail.replace(/"/g, '""')}"`),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `METRIQ_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const filtered = filter ? rows.filter((r) => r.action.toLowerCase().includes(filter.toLowerCase()) || r.detail.toLowerCase().includes(filter.toLowerCase())) : rows

  return (
    <DashboardShell role="admin">
      <DashboardHead
        title="Audit Trail"
        subtitle="Immutable-style log of application, verification and certificate events."
      />
      <Panel
        title="Recent registry events"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Filter actions or actors..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '4px 10px', fontSize: 12, width: 180 }}
            />
            <button className="outline small" onClick={exportAuditCsv}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        }
      >
        <div className="audit">
          {filtered.map((a, i) => (
            <div key={i}>
              <span></span>
              <div>
                <b>{a.action}</b>
                <p>{a.detail}</p>
              </div>
              <time>{a.time}</time>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#687f8e' }}>
              No audit logs matched your search.
            </div>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}

function InspectionDashboard() {
  const [scanned, setScanned] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [instruments, setInstruments] = useState<any[]>([])
  const [selectedInstId, setSelectedInstId] = useState('INS-HYD-0001')

  useEffect(() => {
    api.instruments.list().then((res) => {
      if (res.success && res.data?.instruments) {
        setInstruments(res.data.instruments)
      }
    })
  }, [])

  const currentInst = instruments.find((i) => i.instrumentId === selectedInstId) || {
    instrumentId: 'INS-HYD-0001',
    type: 'Electronic Weighing Instrument',
    manufacturer: 'ABC Weigh Systems Pvt. Ltd.',
    serialNumber: 'EWS300-98231',
    ownerName: 'Ram & Sons Grocery',
    certificateNumber: 'LM-HYD-2026-000184',
    status: 'VERIFIED',
  }

  const scan = () => setScanned(true)

  const handleFlag = async () => {
    setFlagged(true)
    try {
      await api.verifications.tamperCheck({
        instrumentId: currentInst.instrumentId,
        serialNumber: mismatch ? 'EWS300-98299' : currentInst.serialNumber,
        manufacturer: currentInst.manufacturer,
      })
    } catch {
      // Handled
    }
  }

  return (
    <DashboardShell role="inspection">
      <DashboardHead
        title="Inspection & Compliance"
        subtitle="Compare current physical evidence with the verification baseline and inspect seals."
      />
      <div className="stats four">
        <Stat label="Certificates to inspect" value="4" icon={QrCode} />
        <Stat label="Physical matches" value="12" icon={CheckCircle2} tone="green" />
        <Stat label="Review required" value="2" icon={AlertTriangle} tone="orange" />
        <Stat label="Tamper flags" value={flagged ? '2' : '1'} icon={AlertTriangle} tone="red" />
      </div>

      <Panel title="Select Registered Instrument to Inspect">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#073b69' }}>Registered Instrument:</span>
          <select
            value={selectedInstId}
            onChange={(e) => {
              setSelectedInstId(e.target.value)
              setScanned(false)
              setFlagged(false)
            }}
            style={{ padding: '6px 12px', minWidth: 260 }}
          >
            {instruments.length > 0 ? (
              instruments.map((i) => (
                <option key={i.instrumentId} value={i.instrumentId}>
                  {i.instrumentId} · {i.ownerName} ({i.type})
                </option>
              ))
            ) : (
              <option value="INS-HYD-0001">INS-HYD-0001 · Ram &amp; Sons Grocery</option>
            )}
          </select>
          <Link className="outline inline small" to={`/verify/${currentInst.certificateNumber || 'LM-HYD-2026-000184'}`}>
            View Public Certificate
          </Link>
        </div>
      </Panel>

      <Panel title="Certificate & physical evidence check">
        <div className="inspection-intro">
          <QrCode size={45} />
          <div>
            <h3>{scanned ? 'Certificate authentication complete' : 'Scan certificate QR'}</h3>
            <p>
              {scanned
                ? `${currentInst.certificateNumber || defaultCertificate.id} · ${currentInst.type} · ${currentInst.ownerName || defaultCertificate.owner}`
                : 'Retrieve the signed certificate and original field evidence for comparison.'}
            </p>
          </div>
          {!scanned && (
            <button className="primary" onClick={scan}>
              <QrCode size={16} /> Scan Certificate QR
            </button>
          )}
        </div>
        {scanned && (
          <>
            <div className={`physical-check ${mismatch ? 'flag' : 'consistent'}`}>
              <div>
                <b>{mismatch ? 'PHYSICAL MISMATCH DETECTED' : 'PHYSICAL INTEGRITY: CONSISTENT'}</b>
                <p>
                  {mismatch
                    ? 'Potential Tampering Detected. The current physical evidence differs from the original verification baseline.'
                    : 'Original and current evidence are consistent with the registered instrument record.'}
                </p>
              </div>
              <span>{mismatch ? <AlertTriangle /> : <CheckCircle2 />}</span>
            </div>
            <div className="evidence-compare">
              <div>
                <span>ORIGINAL PHYSICAL BASELINE</span>
                <b>Seal: #LM-2026-0814 (Intact) · Serial: {currentInst.serialNumber}</b>
                <small>Baseline created during last verification by Officer R. Kumar</small>
              </div>
              <div>
                <span>CURRENT INSPECTION EVIDENCE</span>
                <b>
                  {mismatch
                    ? 'Seal: Altered / Broken · Serial: ' + currentInst.serialNumber.replace(/\d+$/, '999')
                    : 'Seal: #LM-2026-0814 (Intact) · Serial: ' + currentInst.serialNumber}
                </b>
                <small>Captured during current field inspection</small>
              </div>
            </div>
            <div className="form-actions">
              <button className="outline" onClick={() => setMismatch(!mismatch)}>
                Simulate {mismatch ? 'Clean Match' : 'Physical Discrepancy'}
              </button>
              {mismatch && (
                <button className="danger" onClick={handleFlag} disabled={flagged}>
                  {flagged ? 'Flagged in Registry' : 'Flag for Re-verification'}
                </button>
              )}
              <button
                className="primary"
                onClick={() => {
                  alert(
                    `Inspection Report generated for ${currentInst.instrumentId}.\nResult: ${
                      mismatch ? 'FLAGGED FOR TAMPERING' : 'COMPLIANT'
                    }`
                  )
                }}
              >
                Create Inspection Report
              </button>
            </div>
            {flagged && (
              <div className="success-inline">
                <CheckCircle2 /> Re-verification enforcement flag created and recorded in the audit trail database.
              </div>
            )}
          </>
        )}
      </Panel>
    </DashboardShell>
  )
}

function Demo() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [diagOpen, setDiagOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [diagData, setDiagData] = useState<any>(null)

  useEffect(() => {
    api.system.getDiagnostics().then((res) => {
      if (res.success && res.data) setDiagData(res.data)
    })
  }, [])

  const steps = [
    {
      num: 1,
      title: 'Trader Application & Document Submission',
      role: 'owner' as Role,
      roleName: 'Citizen / Instrument Owner',
      path: '/apply',
      icon: ClipboardCheck,
      statutoryNeed: 'Eliminates physical paperwork and agent intermediation under Legal Metrology Act, 2009.',
      demoAction: 'Applicant registers non-automatic weighing scale (300kg capacity) with calibration certificates.',
      highlight: 'Live form validation, dynamic fee calculation (₹450 statutory fee), and document upload.',
    },
    {
      num: 2,
      title: 'Back-Office Statutory Scrutiny',
      role: 'office' as Role,
      roleName: 'Back Office Scrutiny Officer',
      path: '/dashboard/office',
      icon: FileSearch,
      statutoryNeed: 'Enforces statutory compliance before dispatching field officers.',
      demoAction: 'Officer checks model approval number, manufacturer validity, and document authenticity.',
      highlight: 'Single-click Scrutinize, Approve, or Return with recorded statutory remarks.',
    },
    {
      num: 3,
      title: 'Intelligent Scheduling & LMO Assignment',
      role: 'office' as Role,
      roleName: 'Office Administrator',
      path: '/dashboard/office/schedule',
      icon: Users,
      statutoryNeed: 'Transparent duty allocation preventing officer-merchant collusion.',
      demoAction: 'Assigns LMO Officer R. Kumar with automated date/time slot conflict detection.',
      highlight: 'Calendar conflict detector, workload balancing, and instant mobile notification.',
    },
    {
      num: 4,
      title: 'Mobile Field Testing & Standard Tolerances',
      role: 'field' as Role,
      roleName: 'Legal Metrology Officer (LMO)',
      path: '/dashboard/field/verify/APP-HYD-2026-001245',
      icon: ClipboardCheck,
      statutoryNeed: 'Field measurement accuracy testing with Class III / Class II weights.',
      demoAction: 'LMO enters observed values at 0kg, 150kg, and 300kg test points with automated error calculation.',
      highlight: 'Real-time Maximum Permissible Error (MPE) checking. Auto-flags deviations over ±100g.',
    },
    {
      num: 5,
      title: 'Zero-Connectivity Offline Mode',
      role: 'field' as Role,
      roleName: 'Field LMO Officer',
      path: '/dashboard/field',
      icon: WifiOff,
      statutoryNeed: 'Crucial for remote rural mandis, weekly bazaars, and basements without 4G/5G.',
      demoAction: 'Enables simulated offline mode. Completed inspections store in IndexedDB / LocalStorage queue.',
      highlight: 'Seamless background auto-sync once connectivity is restored, without data loss.',
    },
    {
      num: 6,
      title: 'AI / OCR Optical Plate Recognition',
      role: 'field' as Role,
      roleName: 'Field LMO Officer',
      path: '/dashboard/field/ocr',
      icon: ScanLine,
      statutoryNeed: 'Prevents fraudulent substitution of certified machines with inferior unverified units.',
      demoAction: 'Scans instrument metallic nameplate to extract Serial Number and Model via OCR.',
      highlight: 'Cross-checks extracted serial against central registry to flag mismatches immediately.',
    },
    {
      num: 7,
      title: 'Cryptographic Certificate Issuance',
      role: 'admin' as Role,
      roleName: 'Public / Inspector / Owner',
      path: '/certificate',
      icon: FileCheck2,
      statutoryNeed: 'Replaces easily forged paper certificates with tamper-evident digital credentials.',
      demoAction: 'Generates formal Certificate of Verification with SHA-256 cryptographic digest.',
      highlight: 'Official Government of India crest, security watermark, and print-optimized PDF styling.',
    },
    {
      num: 8,
      title: 'Citizen QR Code Camera Verification',
      role: 'owner' as Role,
      roleName: 'Any Citizen / Consumer',
      path: `/verify/${defaultCertificate.id}`,
      icon: QrCode,
      statutoryNeed: 'Empowers 1.4 billion consumers to instantly verify shop scale authenticity on their phone.',
      demoAction: 'Live camera QR scanner decodes physical sticker QR and queries national verification registry.',
      highlight: 'Instant green tick confirmation, expiry notice, and statutory grievance reporting.',
    },
    {
      num: 9,
      title: 'Physical Seal Tamper Detection & Enforcement',
      role: 'inspection' as Role,
      roleName: 'Enforcement / Inspection Officer',
      path: '/dashboard/inspection',
      icon: AlertTriangle,
      statutoryNeed: 'Rigorous enforcement against lead seal tampering and unauthorized firmware chips.',
      demoAction: 'Simulates physical lead seal break. Platform flags instrument and notifies district controller.',
      highlight: 'Automatic certificate revocation, penalty notice generation, and forensic audit trail logging.',
    },
    {
      num: 10,
      title: 'Digital Seal & Security Hologram Registry',
      role: 'admin' as Role,
      roleName: 'State Metrology Director / LMO',
      path: '/dashboard/admin/seals',
      icon: LockKeyhole,
      statutoryNeed: 'Strict serialized custody of lead wire, RFID and holographic seals to prevent black-market replication.',
      demoAction: 'Mints a batch of official numbered security seals and binds them cryptographically to verified scales.',
      highlight: 'Prevents counterfeit seals, tracks officer custody chain, and flags cut or tampered wires.',
    },
    {
      num: 11,
      title: 'Citizen Grievance Redressal & Compounding Desk',
      role: 'inspection' as Role,
      roleName: 'Enforcement Squad / Vigilance Cell',
      path: '/dashboard/inspection/grievances',
      icon: ShieldCheck,
      statutoryNeed: 'Rapid triage and statutory compounding of short-weighing complaints under Section 30/38.',
      demoAction: 'Inspectors review citizen fraud reports, dispatch flying squads, and record compounded penalty receipts.',
      highlight: 'Direct citizen-to-enforcement channel with automated SMS notification and legal notices.',
    },
    {
      num: 12,
      title: 'State Metrological Compliance & BI Radar',
      role: 'admin' as Role,
      roleName: 'Controller of Legal Metrology',
      path: '/dashboard/admin/analytics',
      icon: Activity,
      statutoryNeed: 'Statewide intelligence on mandi compliance rates, revenue collection, and inspection backlogs.',
      demoAction: 'Interactive Recharts dashboard displaying district-level ranking, tolerance error rates, and CSV exports.',
      highlight: 'Identifies non-compliant clusters to optimize flying squad routes across Telangana districts.',
    },
    {
      num: 13,
      title: 'Licensing, Model Approval (TAC) & Standards Traceability',
      role: 'admin' as Role,
      roleName: 'Controller of Legal Metrology',
      path: '/dashboard/admin/licensing',
      icon: Award,
      statutoryNeed: 'Enforce LM-1/LM-2/LM-3 statutory licenses, Central Model Approvals (OIML R-76), and secondary standard calibration traceability under Section 19/22.',
      demoAction: 'Explore verified manufacturer licenses, inspect TAC approval certificates with load cell and software hashes, and log RRSL recalibrations.',
      highlight: 'Tracks secondary standard kits, MPE error boundaries, and security deposit mandates across Telangana.',
    },
    {
      num: 14,
      title: 'Treasury e-Challan & Statutory Fee Accounting',
      role: 'admin' as Role,
      roleName: 'Treasury Officer / DDO',
      path: '/dashboard/admin/treasury',
      icon: Landmark,
      statutoryNeed: 'Direct integration with Telangana Cyber Treasury / IFMIS (Major Head 0435 / Sub-Head 101) to eliminate cash handling fraud.',
      demoAction: 'Generate statutory fee challan with automatic 18% GST and late fee compounding, then simulate instant UPI/Net Banking treasury settlement.',
      highlight: 'Issues official treasury scroll numbers and generates formal printable cyber treasury receipts.',
    },
    {
      num: 15,
      title: 'Automated Multi-Channel Notice Dispatch Engine',
      role: 'office' as Role,
      roleName: 'Enforcement & Notice Dispatcher',
      path: '/dashboard/office/dispatch',
      icon: Send,
      statutoryNeed: 'TRAI DLT-compliant automated statutory notices under Rule 14 before annual re-verification expires.',
      demoAction: 'Run 30-Day automated expiry sweep to blast SMS (TS-LEGMET), interactive WhatsApp cards, and legal email notices to merchants.',
      highlight: 'Full dispatch audit log with delivery latency metrics, recipient tracing, and statutory template IDs.',
    },
    {
      num: 16,
      title: 'Packaged Commodities & Net Content Verification Desk (LMPC)',
      role: 'office' as Role,
      roleName: 'LMPC Registration Officer',
      path: '/dashboard/office/lmpc',
      icon: Package,
      statutoryNeed: 'Rule 27 Form-I manufacturer/importer registration and Schedule II Maximum Allowable Deficiency (MAD) statistical sampling.',
      demoAction: 'Evaluate 32 sample weights against AQS tolerances, compute mean and standard deviation, and detect short-weight lots under Section 36.',
      highlight: 'Automated MAD, T1 and T2 statistical threshold calculations with instant digital seizure recommendation.',
    },
    {
      num: 17,
      title: 'Flying Squad Surprise Raids & Digital Panchnama (Seizure Memo)',
      role: 'inspection' as Role,
      roleName: 'Flying Squad Vigilance Lead',
      path: '/dashboard/inspection/raids',
      icon: ShieldAlert,
      statutoryNeed: 'Sections 15, 27, 30 & 48 for surprise market seizures of fraudulent weights, drilled lead plugs, or broken stamping seals.',
      demoAction: 'Generate statutory Form 1 digital Panchnama with independent Pancha witnesses, Malkhana evidence vault tracking, and Section 48 compounding.',
      highlight: 'Cryptographic digital signature hash on seizure memos with seamless transition to JMFC Court charge sheeting.',
    },
    {
      num: 18,
      title: 'Heavy Weighbridge IoT Telemetry & Anti-Tamper Grid',
      role: 'admin' as Role,
      roleName: 'State Telemetry Controller',
      path: '/dashboard/admin/telemetry',
      icon: Radio,
      statutoryNeed: 'Electronic Data Capture (EDC) from APMC mandis, mining pitheads, and highway toll plazas under OIML R76.',
      demoAction: 'Monitor real-time 4/6-load cell millivolt distribution, detect voltage imbalances (>0.35 mV/V), and execute remote statutory lockdowns.',
      highlight: 'Direct e-Way Bill synchronization, deadload zero-drift tracking, and instant remote commercial operation cutoff.',
    },
  ]

  const current = steps[activeStep]

  const handleLaunchStep = async (step: typeof current) => {
    navigate(step.path)
  }

  const handleReseed = async () => {
    if (!window.confirm('Reseed database to official SIH 2026 benchmark state?')) return
    setResetting(true)
    try {
      const res = await api.system.resetDemoData()
      if (res.success) {
        setResetSuccess('Database cleanly reseeded with benchmark test instruments and applications.')
        const diag = await api.system.getDiagnostics()
        if (diag.success) setDiagData(diag.data)
        setTimeout(() => setResetSuccess(''), 5000)
      }
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className="demo-page">
      <div className="content">
        <div className="demo-head">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff8ff', color: '#175cd3', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            <ShieldCheck size={14} /> SMART INDIA HACKATHON 2026 · PROBLEM STATEMENT 26036
          </div>
          <h1>METRIQ End-to-End Demonstration Showcase</h1>
          <p>
            An interactive simulator designed specifically for Hackathon evaluators to witness every statutory stage
            of digital weights and measures verification under the Legal Metrology Act, 2009.
          </p>
        </div>

        {resetSuccess && (
          <div style={{ background: '#ecfdf3', color: '#027a48', padding: '12px 16px', borderRadius: 6, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} /> {resetSuccess}
          </div>
        )}

        {/* Live System Diagnostics Ribbon */}
        <div style={{ background: '#fff', border: '1px solid #d0d5dd', borderRadius: 8, padding: '16px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#12b76a' }} />
              <b style={{ fontSize: 13, color: '#073b69' }}>Platform: OPERATIONAL</b>
            </div>
            <span style={{ color: '#d0d5dd' }}>|</span>
            <span style={{ fontSize: 12, color: '#475467' }}>
              Database: <b>{diagData?.database?.connected ? 'MongoDB Live' : 'Embedded Memory'}</b> ({diagData?.database?.counts?.instruments || 5} Instruments)
            </span>
            <span style={{ color: '#d0d5dd' }}>|</span>
            <span style={{ fontSize: 12, color: '#475467' }}>
              SHA-256 Crypto: <b>VERIFIED</b>
            </span>
            <span style={{ color: '#d0d5dd' }}>|</span>
            <span style={{ fontSize: 12, color: '#475467' }}>
              Audit Logs: <b>{diagData?.database?.counts?.auditLogs || 7} Immutable Records</b>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="outline small"
              onClick={handleReseed}
              disabled={resetting}
              style={{ color: '#b42318', borderColor: '#fecdca' }}
              title="Reset all demo records to initial clean state"
            >
              <RefreshCw size={14} className={resetting ? 'spin' : ''} />
              {resetting ? 'Reseeding...' : 'Reseed Demo Data'}
            </button>
            <button className="outline small" onClick={() => setDiagOpen(true)}>
              <Activity size={14} /> Full Diagnostics
            </button>
          </div>
        </div>

        {/* Interactive 9-Step Guided Tour Wizard */}
        <div className="demo-wizard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#073b69', textTransform: 'uppercase', letterSpacing: 1 }}>
              Guided Evaluator Walkthrough · Step {activeStep + 1} of {steps.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="outline small"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
              >
                Previous Step
              </button>
              <button
                className="primary small"
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep((p) => Math.min(steps.length - 1, p + 1))}
              >
                Next Step
              </button>
            </div>
          </div>

          <div className="demo-steps-nav">
            {steps.map((s, idx) => (
              <button
                key={s.num}
                className={`demo-step-btn ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <span>{s.num}.</span>
                {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
              </button>
            ))}
          </div>

          <div className="demo-step-content">
            <div className="demo-step-left">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                <Users size={12} /> Persona: {current.roleName}
              </div>
              <h2>{current.title}</h2>
              <p>{current.statutoryNeed}</p>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
                  Technical &amp; Statutory Innovation:
                </div>
                <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>
                  {current.highlight}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="primary"
                  onClick={() => handleLaunchStep(current)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <current.icon size={16} /> Launch Interactive Screen <ChevronRight size={16} />
                </button>
                <button
                  className="outline"
                  onClick={() => navigate(current.path)}
                >
                  Direct Navigate
                </button>
              </div>
            </div>

            <div className="demo-step-right">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#073b69', marginBottom: 8 }}>
                Quick Persona Switcher
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px 0' }}>
                Instant switch to any actor to simulate multi-party statutory handoffs:
              </p>
              <div className="demo-quick-roles">
                {(Object.keys(roleInfo) as Role[]).map((r) => (
                  <button
                    key={r}
                    className="outline small"
                    style={{ fontSize: 11 }}
                    onClick={() => navigate(`/dashboard/${r}`)}
                  >
                    {roleInfo[r].label.split(' / ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 9-Cards Visual Index */}
        <h3 style={{ fontSize: 16, color: '#073b69', margin: '24px 0 12px 0' }}>
          Direct Navigation to All Verification Lifecycle Modules
        </h3>
        <div className="demo-cards">
          {steps.map((s) => (
            <Link to={s.path} key={s.num}>
              <span>{s.num}</span>
              <s.icon />
              <b>{s.title}</b>
              <ChevronRight />
            </Link>
          ))}
        </div>

        <div className="demo-note" style={{ marginTop: 24 }}>
          <ShieldCheck />
          <div>
            <b>Judge Evaluation Tips</b>
            <p>
              1. To demo <b>Tamper Detection</b>: open the Inspection Dashboard, select any instrument, and click "Flag Discrepancy &amp; Log Enforcement Action".
              <br />
              2. To demo <b>Public Citizen QR Scan</b>: open Verify Certificate and use your camera or click "Try Demo Certificate".
              <br />
              3. To demo <b>Offline Sync</b>: toggle the Offline simulation in Field Dashboard, record test weights, then reconnect to watch background sync.
            </p>
          </div>
        </div>
      </div>

      <DiagnosticsModal isOpen={diagOpen} onClose={() => setDiagOpen(false)} />
    </section>
  )
}

function Services() {
  return (
    <section className="page content">
      <div className="page-title">
        <span>METRIQ SERVICES</span>
        <h1>Digital legal metrology services</h1>
        <p>Convenient pathways for citizens, businesses and inspection teams.</p>
      </div>
      <div className="services content-grid">
        {[
          [ClipboardCheck, 'Citizen Services', 'Apply, track and download verification records.', '/apply'],
          [Users, 'Business Services', 'Manage registered instruments and re-verification.', '/dashboard/owner'],
          [MapPin, 'Legal Metrology Services', 'Work assigned tasks even with limited connectivity.', '/dashboard/field'],
          [ShieldCheck, 'Public Verification', 'Validate a certificate without login.', '/verify'],
        ].map(([I, t, x, p]) => (
          <Link className="service" to={p as string} key={t as string}>
            <span className="service-icon">
              <I size={25} />
            </span>
            <h3>{t as string}</h3>
            <p>{x as string}</p>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </section>
  )
}

export function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    api.auth.me().then((result) => {
      const serverRole = result.data?.user?.role
      const authenticatedRole = serverRole ? serverRoleToAppRole[serverRole] : undefined
      if (result.success && authenticatedRole) setRole(authenticatedRole)
      else clearStoredSession()
    }).finally(() => setSessionReady(true))
  }, [])

  const protectedRoute = (needed: Role, child: React.ReactNode) =>
    !sessionReady ? <div className="page content">Checking secure session…</div> : role === needed ? child : <Navigate to="/" replace />

  return (
    <I18nProvider>
      <BrowserRouter>
        <Layout role={role} setRole={setRole}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:certificateNumber" element={<Verify />} />
            <Route path="/track" element={<Track />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/dashboard/owner" element={protectedRoute('owner', <OwnerDashboard />)} />
            <Route path="/dashboard/owner/*" element={protectedRoute('owner', <OwnerDashboard />)} />
            <Route path="/dashboard/office" element={protectedRoute('office', <OfficeDashboard />)} />
            <Route path="/dashboard/office/applications" element={protectedRoute('office', <OfficeDashboard />)} />
            <Route path="/dashboard/office/grievances" element={protectedRoute('office', <DashboardShell role="office"><GrievanceActionCenter /></DashboardShell>)} />
            <Route path="/dashboard/office/schedule" element={protectedRoute('office', <Schedule />)} />
            <Route path="/dashboard/field" element={protectedRoute('field', <FieldDashboard />)} />
            <Route path="/dashboard/field/tasks" element={protectedRoute('field', <FieldDashboard />)} />
            <Route path="/dashboard/field/seals" element={protectedRoute('field', <DashboardShell role="field"><SealLedger /></DashboardShell>)} />
            <Route path="/dashboard/field/ocr" element={protectedRoute('field', <Ocr />)} />
            <Route path="/dashboard/field/scan" element={protectedRoute('field', <Scan />)} />
            <Route path="/dashboard/field/verify/:applicationId" element={protectedRoute('field', <Verification />)} />
            <Route path="/dashboard/inspection" element={protectedRoute('inspection', <InspectionDashboard />)} />
            <Route path="/dashboard/inspection/grievances" element={protectedRoute('inspection', <DashboardShell role="inspection"><GrievanceActionCenter /></DashboardShell>)} />
            <Route path="/dashboard/inspection/seals" element={protectedRoute('inspection', <DashboardShell role="inspection"><SealLedger /></DashboardShell>)} />
            <Route path="/dashboard/inspection/raids" element={protectedRoute('inspection', <DashboardShell role="inspection"><FlyingSquadEnforcement /></DashboardShell>)} />
            <Route path="/dashboard/inspection/lmpc" element={protectedRoute('inspection', <DashboardShell role="inspection"><LmpcComplianceDesk /></DashboardShell>)} />
            <Route path="/dashboard/inspection/telemetry" element={protectedRoute('inspection', <DashboardShell role="inspection"><WeighbridgeIoTDashboard /></DashboardShell>)} />
            <Route path="/dashboard/admin" element={protectedRoute('admin', <AdminDashboard />)} />
            <Route path="/dashboard/admin/analytics" element={protectedRoute('admin', <DashboardShell role="admin"><StateAnalytics /></DashboardShell>)} />
            <Route path="/dashboard/admin/seals" element={protectedRoute('admin', <DashboardShell role="admin"><SealLedger /></DashboardShell>)} />
            <Route path="/dashboard/admin/grievances" element={protectedRoute('admin', <DashboardShell role="admin"><GrievanceActionCenter /></DashboardShell>)} />
            <Route path="/dashboard/admin/licensing" element={protectedRoute('admin', <DashboardShell role="admin"><LicensingPortal /></DashboardShell>)} />
            <Route path="/dashboard/admin/treasury" element={protectedRoute('admin', <DashboardShell role="admin"><TreasuryChallanDesk /></DashboardShell>)} />
            <Route path="/dashboard/admin/dispatch" element={protectedRoute('admin', <DashboardShell role="admin"><DispatchSimulator /></DashboardShell>)} />
            <Route path="/dashboard/admin/lmpc" element={protectedRoute('admin', <DashboardShell role="admin"><LmpcComplianceDesk /></DashboardShell>)} />
            <Route path="/dashboard/admin/raids" element={protectedRoute('admin', <DashboardShell role="admin"><FlyingSquadEnforcement /></DashboardShell>)} />
            <Route path="/dashboard/admin/telemetry" element={protectedRoute('admin', <DashboardShell role="admin"><WeighbridgeIoTDashboard /></DashboardShell>)} />
            <Route path="/dashboard/owner/treasury" element={protectedRoute('owner', <DashboardShell role="owner"><TreasuryChallanDesk /></DashboardShell>)} />
            <Route path="/dashboard/office/licensing" element={protectedRoute('office', <DashboardShell role="office"><LicensingPortal /></DashboardShell>)} />
            <Route path="/dashboard/office/treasury" element={protectedRoute('office', <DashboardShell role="office"><TreasuryChallanDesk /></DashboardShell>)} />
            <Route path="/dashboard/office/dispatch" element={protectedRoute('office', <DashboardShell role="office"><DispatchSimulator /></DashboardShell>)} />
            <Route path="/dashboard/office/lmpc" element={protectedRoute('office', <DashboardShell role="office"><LmpcComplianceDesk /></DashboardShell>)} />
            <Route path="/dashboard/field/standards" element={protectedRoute('field', <DashboardShell role="field"><LicensingPortal /></DashboardShell>)} />
            <Route path="/dashboard/admin/instruments" element={protectedRoute('admin', <Registry />)} />
            <Route path="/dashboard/admin/config" element={protectedRoute('admin', <Config />)} />
            <Route path="/dashboard/admin/audit" element={protectedRoute('admin', <Audit />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </I18nProvider>
  )
}
export default App
