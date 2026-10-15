import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactSpeedometer from 'react-d3-speedometer'
import { Activity, Bell, ChartNoAxesCombined, FileSpreadsheet, Mail, Menu, RefreshCw, Send, Settings, Thermometer, X } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import coriotlabLogo from '../Coriotlab_Logo_Hor_FullColor.jpg'

type RangeKey = '1h' | '6h' | '12h' | '24h' | '2d' | '7d' | '30d'
type SensorKey = 'temp1' | 'temp2' | 'temp3' | 'temp4' | 'temp5' | 'temp6'
type AlertChannel = 'email' | 'telegram'

type ReportYear = 2024 | 2025 | 2026 | 2027

type DeviceSetting = {
  dev_eui: string
  device_name: string
}

type LatestUplink = {
  time: string
  application_id: string
  application_name: string
  device_name: string
  dev_eui: string
  fields: Record<string, number | null>
}

type HistoricalUplinksResponse = {
  dev_eui: string
  device_name: string
  count: number
  uplinks: LatestUplink[]
}

const ranges: Array<{ key: RangeKey; label: string; start: string; limit: number }> = [
  { key: '1h', label: 'Ultima hora', start: '-1h', limit: 12 },
  { key: '6h', label: 'Ultimas 6 horas', start: '-6h', limit: 72 },
  { key: '12h', label: 'Ultimas 12 horas', start: '-12h', limit: 144 },
  { key: '24h', label: 'Ultimas 24 horas', start: '-24h', limit: 288 },
  { key: '2d', label: 'Ultimos 2 dias', start: '-48h', limit: 576 },
  { key: '7d', label: 'Ultimos 7 dias', start: '-7d', limit: 672 },
  { key: '30d', label: 'Ultimos 30 dias', start: '-30d', limit: 1000 },
]

const SENSOR_CHART_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#F97316', '#9333EA', '#06B6D4'] as const
const SENSOR_GAUGE_ICON_COLORS = ['#93C5FD', '#86EFAC', '#FCA5A5', '#FDBA74', '#D8B4FE', '#67E8F9'] as const

const sensorConfig: Array<{
  key: SensorKey
  label: string
  unit: string
  min: number
  max: number
  chartColor: string
  gaugeIconColor: string
  icon: typeof Thermometer
}> = [
  {
    key: 'temp1',
    label: 'Sensor 1',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[0],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[0],
    icon: Thermometer,
  },
  {
    key: 'temp2',
    label: 'Sensor 2',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[1],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[1],
    icon: Thermometer,
  },
  {
    key: 'temp3',
    label: 'Sensor 3',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[2],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[2],
    icon: Thermometer,
  },
  {
    key: 'temp4',
    label: 'Sensor 4',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[3],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[3],
    icon: Thermometer,
  },
  {
    key: 'temp5',
    label: 'Sensor 5',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[4],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[4],
    icon: Thermometer,
  },
  {
    key: 'temp6',
    label: 'Sensor 6',
    unit: 'C',
    min: 0,
    max: 120,
    chartColor: SENSOR_CHART_COLORS[5],
    gaugeIconColor: SENSOR_GAUGE_ICON_COLORS[5],
    icon: Thermometer,
  },
]

const reportBaseUrl = '/api/v1/devices/report'
const defaultDeviceSetting: DeviceSetting = {
  dev_eui: '421414b5397bffb1',
  device_name: 'CORIOT_DS18_01',
}
const dashboardTimeZone = 'America/Bogota'
const currentMonth = new Date().getMonth() + 1
const reportYears: ReportYear[] = [2024, 2025, 2026, 2027]
const reportMonths = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
] as const
const emptyFields: LatestUplink['fields'] = {
  temp1: 0,
  temp2: 0,
  temp3: 0,
  temp4: 0,
  temp5: 0,
  temp6: 0,
}

const deviceSettingQueryKey = ['dashboard-device-setting']

function formatAdjustedTimestamp(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: dashboardTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: true,
  }).format(new Date(value))
}

function formatChartTimestamp(value: string, range: RangeKey) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: dashboardTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    ...(['2d', '7d', '30d'].includes(range) ? { day: '2-digit', month: '2-digit' } : {}),
    hour12: false,
  }).format(new Date(value))
}

async function fetchDeviceSetting(): Promise<DeviceSetting> {
  const response = await fetch('/api/v1/settings/device')

  if (!response.ok) {
    throw new Error(`No se pudo leer la configuracion del dispositivo (${response.status})`)
  }

  return response.json()
}

async function updateDeviceSetting(payload: DeviceSetting, adminToken: string): Promise<DeviceSetting> {
  const response = await fetch('/api/v1/settings/device', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('El token no tiene permisos para cambiar la configuracion')
    }
    throw new Error(`No se pudo guardar la configuracion (${response.status})`)
  }

  return response.json()
}

async function fetchLatestUplink(devEui: string): Promise<LatestUplink> {
  const response = await fetch(`/api/v1/devices/by-dev-eui/${encodeURIComponent(devEui)}/uplinks/latest`)

  if (!response.ok) {
    throw new Error(`No se pudo leer el endpoint (${response.status})`)
  }

  return response.json()
}

async function fetchHistoricalUplinks(devEui: string, range: RangeKey): Promise<HistoricalUplinksResponse> {
  const selectedRange = ranges.find((item) => item.key === range) ?? ranges[0]
  const params = new URLSearchParams({
    start: selectedRange.start,
    stop: 'now()',
    limit: String(selectedRange.limit),
  })
  const response = await fetch(
    `/api/v1/devices/by-dev-eui/${encodeURIComponent(devEui)}/uplinks?${params.toString()}`,
  )

  if (!response.ok) {
    throw new Error(`No se pudo leer el historico (${response.status})`)
  }

  return response.json()
}

function makeHistory(range: RangeKey, uplinks: LatestUplink[]) {
  return [...uplinks]
    .reverse()
    .map((uplink) => ({
      time: formatChartTimestamp(uplink.time, range),
      temp1: uplink.fields.temp1,
      temp2: uplink.fields.temp2,
      temp3: uplink.fields.temp3,
      temp4: uplink.fields.temp4,
      temp5: uplink.fields.temp5,
      temp6: uplink.fields.temp6,
    }))
}

function extractFilename(response: Response, year: number, month: number) {
  const contentDisposition = response.headers.get('content-disposition')
  const filenameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)

  if (filenameMatch?.[1]) {
    return decodeURIComponent(filenameMatch[1].replace(/"/g, '').trim())
  }

  return `reporte_dispositivo_${year}_${String(month).padStart(2, '0')}.xlsx`
}

function SensorGauge({
  sensor,
  updatedAt,
}: {
  sensor: (typeof sensorConfig)[number] & { value: number }
  updatedAt: string
}) {
  const Icon = sensor.icon
  const percent = Math.min(100, Math.max(0, ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100))

  return (
    <article className="gauge-card">
      <div className="gauge-heading">
        <span className="sensor-icon" style={{ color: sensor.chartColor, backgroundColor: sensor.gaugeIconColor }}>
          <Icon size={18} />
        </span>
        <div>
          <strong>{sensor.label}</strong>
          <small>{updatedAt}</small>
        </div>
      </div>
      <div className="gauge-visual">
        <div className="speedometer-wrap">
          <ReactSpeedometer
            minValue={sensor.min}
            maxValue={sensor.max}
            value={sensor.value}
            segments={5}
            needleColor="#56ACDE"
            needleHeightRatio={0.72}
            ringWidth={18}
            width={220}
            height={140}
            textColor="transparent"
            valueTextFontSize="0px"
            currentValueText=""
            customSegmentStops={[
              sensor.min,
              sensor.min + (sensor.max - sensor.min) * 0.2,
              sensor.min + (sensor.max - sensor.min) * 0.4,
              sensor.min + (sensor.max - sensor.min) * 0.6,
              sensor.min + (sensor.max - sensor.min) * 0.8,
              sensor.max,
            ]}
            segmentColors={['#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B', sensor.chartColor]}
          />
        </div>
        <div className="gauge-value">
          <strong>
            {sensor.value}
            <span>{sensor.unit}</span>
          </strong>
          <small>{Math.round(percent)}% escala</small>
        </div>
      </div>
    </article>
  )
}

function App() {
  const queryClient = useQueryClient()
  const [range, setRange] = useState<RangeKey>('1h')
  const [reportMonth, setReportMonth] = useState(currentMonth)
  const [reportYear, setReportYear] = useState<ReportYear>(2026)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [visibleSensors, setVisibleSensors] = useState<SensorKey[]>(sensorConfig.map((sensor) => sensor.key))
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [alertSensor, setAlertSensor] = useState<SensorKey>('temp1')
  const [alertMinTemperature, setAlertMinTemperature] = useState('0')
  const [alertMaxTemperature, setAlertMaxTemperature] = useState('120')
  const [alertChannel, setAlertChannel] = useState<AlertChannel>('email')
  const [alertDestination, setAlertDestination] = useState('')
  const [mobileNavSection, setMobileNavSection] = useState('overview')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingDevEui, setSettingDevEui] = useState(defaultDeviceSetting.dev_eui)
  const [settingDeviceName, setSettingDeviceName] = useState(defaultDeviceSetting.device_name)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('dashboardAdminToken') ?? '')
  const [isSavingDeviceSetting, setIsSavingDeviceSetting] = useState(false)
  const [deviceSettingError, setDeviceSettingError] = useState<string | null>(null)
  const { data: deviceSettingData, isError: isDeviceSettingError, error: deviceSettingQueryError } = useQuery({
    queryKey: deviceSettingQueryKey,
    queryFn: fetchDeviceSetting,
    placeholderData: defaultDeviceSetting,
    staleTime: Infinity,
  })
  const deviceSetting = deviceSettingData ?? defaultDeviceSetting
  const configuredDevEui = deviceSetting.dev_eui
  const reportDeviceName = deviceSetting.device_name

  useEffect(() => {
    setSettingDevEui(deviceSetting.dev_eui)
    setSettingDeviceName(deviceSetting.device_name)
  }, [deviceSetting.dev_eui, deviceSetting.device_name])

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['latest-uplink', configuredDevEui],
    queryFn: () => fetchLatestUplink(configuredDevEui),
    enabled: Boolean(configuredDevEui),
    refetchInterval: 5 * 60 * 1000,
  })
  const {
    data: historicalData,
    isError: isHistoryError,
    error: historyError,
  } = useQuery({
    queryKey: ['historical-uplinks', configuredDevEui, range],
    queryFn: () => fetchHistoricalUplinks(configuredDevEui, range),
    enabled: Boolean(configuredDevEui),
    refetchInterval: 5 * 60 * 1000,
  })

  const liveFields = data?.fields ?? emptyFields

  const sensors = useMemo(
    () =>
      sensorConfig.map((sensor) => ({
        ...sensor,
        value: Number(liveFields[sensor.key] ?? 0),
      })),
    [liveFields],
  )

  const history = useMemo(
    () => makeHistory(range, historicalData?.uplinks ?? []),
    [range, historicalData],
  )
  const visibleSensorSet = useMemo(() => new Set(visibleSensors), [visibleSensors])
  const updatedAt = data?.time
    ? formatAdjustedTimestamp(data.time)
    : isPending
      ? 'Cargando...'
      : 'Sin lectura'

  async function handleDownloadReport() {
    try {
      setIsDownloadingReport(true)

      const params = new URLSearchParams({
        device_name: reportDeviceName,
        year: String(reportYear),
        month: String(reportMonth).padStart(2, '0'),
        resolution: 'daily',
      })
      const response = await fetch(`${reportBaseUrl}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`No se pudo generar el reporte (${response.status})`)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = extractFilename(response, reportYear, reportMonth)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (downloadError) {
      window.alert(downloadError instanceof Error ? downloadError.message : 'No se pudo descargar el reporte')
    } finally {
      setIsDownloadingReport(false)
    }
  }

  async function handleDeviceSettingSave() {
    setDeviceSettingError(null)

    if (!adminToken.trim()) {
      setDeviceSettingError('Ingresa un token de administrador para guardar la configuracion')
      return
    }

    try {
      setIsSavingDeviceSetting(true)
      const savedSetting = await updateDeviceSetting(
        { dev_eui: settingDevEui.trim().toLowerCase(), device_name: settingDeviceName.trim() },
        adminToken.trim(),
      )
      sessionStorage.setItem('dashboardAdminToken', adminToken.trim())
      queryClient.setQueryData(deviceSettingQueryKey, savedSetting)
      await queryClient.invalidateQueries({ queryKey: ['latest-uplink'] })
      await queryClient.invalidateQueries({ queryKey: ['historical-uplinks'] })
      setIsSettingsModalOpen(false)
    } catch (saveError) {
      setDeviceSettingError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la configuracion')
    } finally {
      setIsSavingDeviceSetting(false)
    }
  }

  function toggleSensorVisibility(sensorKey: SensorKey) {
    setVisibleSensors((currentSensors) =>
      currentSensors.includes(sensorKey)
        ? currentSensors.filter((currentSensorKey) => currentSensorKey !== sensorKey)
        : [...currentSensors, sensorKey],
    )
  }

  function handleAlertConfirm() {
    setIsAlertModalOpen(false)
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={22} />
          </span>
          <span>CoriotLab</span>
        </div>

        <nav className="nav-list">
          <a className="active" href="#overview">
            <Activity size={18} />
            Ambiente
          </a>
          <a href="#devices">
            <Thermometer size={18} />
            Sensores
          </a>
          <a href="#gateways">
            <ChartNoAxesCombined size={18} />
            Historico
          </a>
          <button
            className="nav-link-button"
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
          >
            <Bell size={18} />
            Alertas
          </button>
          <button
            className="nav-link-button"
            type="button"
            onClick={() => {
              setDeviceSettingError(null)
              setIsSettingsModalOpen(true)
            }}
          >
            <Settings size={18} />
            Ajustes
          </button>
        </nav>

      </aside>

      <nav className="mobile-bottom-nav" aria-label="Navegacion movil">
        <a
          className={`mobile-nav-item ${mobileNavSection === 'overview' ? 'active' : ''}`}
          href="#overview"
          onClick={() => setMobileNavSection('overview')}
        >
          <Activity size={18} />
          <span>Ambiente</span>
        </a>
        <a
          className={`mobile-nav-item ${mobileNavSection === 'devices' ? 'active' : ''}`}
          href="#devices"
          onClick={() => setMobileNavSection('devices')}
        >
          <Thermometer size={18} />
          <span>Sensores</span>
        </a>
        <a
          className={`mobile-nav-item ${mobileNavSection === 'gateways' ? 'active' : ''}`}
          href="#gateways"
          onClick={() => setMobileNavSection('gateways')}
        >
          <ChartNoAxesCombined size={18} />
          <span>Histórico</span>
        </a>
        <button
          className={`mobile-nav-item ${isAlertModalOpen ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setMobileNavSection('alerts')
            setIsAlertModalOpen(true)
          }}
        >
          <Bell size={18} />
          <span>Alertas</span>
        </button>
        <button
          className={`mobile-nav-item ${isSettingsModalOpen ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setMobileNavSection('settings')
            setDeviceSettingError(null)
            setIsSettingsModalOpen(true)
          }}
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </button>
      </nav>

      {isAlertModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAlertModalOpen(false)}>
          <section
            className="alert-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-modal-header">
              <div>
                <p className="eyebrow">Alertas</p>
                <h2 id="alert-modal-title">Configurar notificacion</h2>
              </div>
              <button
                className="icon-button modal-close-button"
                type="button"
                aria-label="Cerrar configuracion de alertas"
                onClick={() => setIsAlertModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="alert-form-grid">
              <label className="alert-field">
                <span>Sensor</span>
                <select value={alertSensor} onChange={(event) => setAlertSensor(event.target.value as SensorKey)}>
                  {sensorConfig.map((sensor) => (
                    <option key={sensor.key} value={sensor.key}>
                      {sensor.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="alert-threshold-grid">
                <label className="alert-field">
                  <span>Temperatura minima</span>
                  <input
                    type="number"
                    value={alertMinTemperature}
                    onChange={(event) => setAlertMinTemperature(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="alert-field">
                  <span>Temperatura maxima</span>
                  <input
                    type="number"
                    value={alertMaxTemperature}
                    onChange={(event) => setAlertMaxTemperature(event.target.value)}
                    placeholder="120"
                  />
                </label>
              </div>

              <fieldset className="alert-channel-group">
                <legend>Canal de alerta</legend>
                <label className={`alert-channel-card ${alertChannel === 'email' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="alert-channel"
                    value="email"
                    checked={alertChannel === 'email'}
                    onChange={() => {
                      setAlertChannel('email')
                      setAlertDestination('')
                    }}
                  />
                  <Mail size={18} />
                  <span>Email</span>
                </label>

                <label className={`alert-channel-card ${alertChannel === 'telegram' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="alert-channel"
                    value="telegram"
                    checked={alertChannel === 'telegram'}
                    onChange={() => {
                      setAlertChannel('telegram')
                      setAlertDestination('')
                    }}
                  />
                  <Send size={18} />
                  <span>Telegram</span>
                </label>
              </fieldset>

              <label className="alert-field">
                <span>{alertChannel === 'telegram' ? 'ID de Telegram' : 'Correo electronico'}</span>
                <input
                  type={alertChannel === 'telegram' ? 'text' : 'email'}
                  value={alertDestination}
                  onChange={(event) => setAlertDestination(event.target.value)}
                  placeholder={alertChannel === 'telegram' ? 'Ej: 123456789' : 'usuario@dominio.com'}
                />
              </label>
            </div>

            <div className="alert-modal-actions">
              <button className="sync-button" type="button" onClick={handleAlertConfirm}>
                OK
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isSettingsModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsSettingsModalOpen(false)}>
          <section
            className="alert-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-modal-header">
              <div>
                <p className="eyebrow">Ajustes</p>
                <h2 id="settings-modal-title">Dispositivo del dashboard</h2>
              </div>
              <button
                className="icon-button modal-close-button"
                type="button"
                aria-label="Cerrar configuracion del dispositivo"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="alert-form-grid">
              <label className="alert-field">
                <span>DevEUI</span>
                <input
                  value={settingDevEui}
                  onChange={(event) => setSettingDevEui(event.target.value)}
                  placeholder="421414b5397bffb1"
                  maxLength={16}
                  spellCheck={false}
                />
              </label>

              <label className="alert-field">
                <span>Nombre del dispositivo</span>
                <input
                  value={settingDeviceName}
                  onChange={(event) => setSettingDeviceName(event.target.value)}
                  placeholder="CORIOT_DS18_01"
                />
              </label>

              <label className="alert-field">
                <span>Token de administrador</span>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  placeholder="Bearer token"
                  autoComplete="off"
                />
              </label>
            </div>

            {deviceSettingError ? <small className="form-error">{deviceSettingError}</small> : null}

            <div className="alert-modal-actions">
              <button
                className="sync-button"
                type="button"
                onClick={() => void handleDeviceSettingSave()}
                disabled={isSavingDeviceSetting}
              >
                {isSavingDeviceSetting ? <RefreshCw size={16} className="spin" /> : <Settings size={16} />}
                {isSavingDeviceSetting ? 'Guardando...' : 'Guardar dispositivo'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <main className="main-panel" id="overview">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="topbar-info">
            <div className="title-logo-wrap" aria-hidden="true">
              <img className="title-logo" src={coriotlabLogo} alt="" />
            </div>
            <h1>Condiciones ambientales</h1>
            <p className="topbar-meta">
              Dispositivo {data?.device_name ?? deviceSetting.device_name} · {configuredDevEui} {isFetching ? '· sincronizando' : ''}
            </p>
            <div className="report-controls" aria-label="Descarga de reporte mensual">
              <label className="report-select">
                <span>Mes</span>
                <select
                  value={reportMonth}
                  onChange={(event) => setReportMonth(Number(event.target.value))}
                  disabled={isDownloadingReport}
                >
                  {reportMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="report-select">
                <span>Año</span>
                <select
                  value={reportYear}
                  onChange={(event) => setReportYear(Number(event.target.value) as ReportYear)}
                  disabled={isDownloadingReport}
                >
                  {reportYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="sync-button report-button excel-button"
                type="button"
                onClick={() => void handleDownloadReport()}
                disabled={isDownloadingReport}
              >
                {isDownloadingReport ? (
                  <RefreshCw size={16} className="spin" />
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                {isDownloadingReport ? 'Generando reporte...' : 'Descargar reporte'}
              </button>
            </div>
          </div>
        </header>

        {isError ? (
          <section className="panel status-panel">
            <strong>No pude leer el endpoint del dispositivo.</strong>
            <small>{error instanceof Error ? error.message : 'Error desconocido'}</small>
          </section>
        ) : null}

        {isDeviceSettingError ? (
          <section className="panel status-panel">
            <strong>No pude leer la configuracion del dispositivo.</strong>
            <small>{deviceSettingQueryError instanceof Error ? deviceSettingQueryError.message : 'Error desconocido'}</small>
          </section>
        ) : null}

        {isHistoryError ? (
          <section className="panel status-panel">
            <strong>No pude leer el historico del dispositivo.</strong>
            <small>{historyError instanceof Error ? historyError.message : 'Error desconocido'}</small>
          </section>
        ) : null}

        <section className="gauges-grid" aria-label="Lecturas actuales de sensores" id="devices">
          {sensors.map((sensor) => (
            <SensorGauge sensor={sensor} updatedAt={updatedAt} key={sensor.key} />
          ))}
        </section>

        <section className="history-grid">
          <article className="panel chart-panel" id="gateways">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Historico</p>
                <h2>Evolucion ambiental</h2>
              </div>
              <label className="range-select">
                <span>Rango</span>
                <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
                  {ranges.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={history}>
                  <CartesianGrid stroke="#56ACDE" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  {sensors
                    .filter((sensor) => visibleSensorSet.has(sensor.key))
                    .map((sensor, index) => (
                      <Line
                        key={sensor.key}
                        type="monotone"
                        dataKey={sensor.key}
                        name={`${sensor.label} ${sensor.unit}`}
                        stroke={sensor.chartColor}
                        strokeWidth={index < 2 ? 3 : 2}
                        dot={false}
                      />
                    ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-grid">
              {sensors.map((sensor) => (
                <label className="legend-item" key={sensor.key}>
                  <input
                    type="checkbox"
                    checked={visibleSensorSet.has(sensor.key)}
                    onChange={() => toggleSensorVisibility(sensor.key)}
                  />
                  <i style={{ backgroundColor: sensor.chartColor }} />
                  {sensor.label}
                </label>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
