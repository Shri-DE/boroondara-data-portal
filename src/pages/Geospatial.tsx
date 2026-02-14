import React, { useState, useEffect, useCallback } from 'react';
import {
  Icon,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  mergeStyleSets,
} from '@fluentui/react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { boroondaraPalette } from '../theme/boroondaraTheme';
import { accessService } from '../services/accessService';

/* ── Fix Leaflet marker icon paths for webpack ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/* ── Palette shorthand ── */
const p = boroondaraPalette;

/* ── Types ── */
interface SpatialLayer {
  layer_id: string;
  code: string;
  name: string;
  description: string;
  layer_type: 'point' | 'polygon' | 'line';
  category: string;
  icon: string;
  color: string;
  feature_count: number;
}

interface SpatialStats {
  totalLayers: number;
  totalFeatures: number;
  polygonLayers: number;
  pointLayers: number;
}

interface FeatureProps {
  feature_id: string;
  name: string;
  description: string;
  layer_name?: string;
  layer_code?: string;
  layer_color?: string;
  layer_type?: string;
  [key: string]: any;
}

/* ── Helpers ── */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
}

/* ── Styles ── */
const styles = mergeStyleSets({
  page: {
    padding: 32, minHeight: 'calc(100vh - 52px)', background: p.bg,
    '@media (max-width: 768px)': { padding: 16 },
  } as any,
  container: { maxWidth: 1240, margin: '0 auto' },

  /* Header */
  headerRow: { marginBottom: 24 },
  title: {
    color: p.text, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', marginBottom: 6,
    '@media (max-width: 768px)': { fontSize: 22 },
  } as any,
  subtitle: { color: p.text2, fontSize: 14, lineHeight: '22px', maxWidth: 720, marginBottom: 14 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 } as any,
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
    background: p.bg2, border: `1px solid ${p.borderSoft}`,
    color: p.text2, fontSize: 12, fontWeight: 500,
  },

  /* KPI row */
  kpiRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24,
    '@media (max-width: 768px)': { gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  } as any,
  kpiCard: {
    padding: 18, borderRadius: 4, background: '#FFFFFF',
    border: `1px solid ${p.border}`, boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    '@media (max-width: 768px)': { padding: 12 },
  } as any,
  kpiIconWrap: {
    width: 32, height: 32, borderRadius: 6, display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11, fontWeight: 600, color: p.text3, textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 2,
  } as any,
  kpiValue: {
    fontSize: 24, fontWeight: 700, color: p.text, letterSpacing: '-0.02em',
    '@media (max-width: 768px)': { fontSize: 20 },
  } as any,
  kpiHint: { fontSize: 11, color: p.text3 },

  /* Map section */
  mapSection: {
    display: 'flex', borderRadius: 4, border: `1px solid ${p.border}`,
    overflow: 'hidden', marginBottom: 24, background: '#FFFFFF',
    '@media (max-width: 768px)': { flexDirection: 'column' },
  } as any,

  /* Layer panel */
  layerPanel: {
    width: 230, background: '#FAFAFA', borderRight: `1px solid ${p.borderSoft}`,
    flexShrink: 0, overflowY: 'auto' as any,
    '@media (max-width: 768px)': {
      width: '100%', borderRight: 'none', borderBottom: `1px solid ${p.borderSoft}`,
      maxHeight: 180, overflowY: 'auto',
    },
  } as any,
  layerPanelTitle: {
    padding: '14px 16px 10px', fontSize: 12, fontWeight: 600, color: p.text,
    display: 'flex', alignItems: 'center', gap: 6,
    borderBottom: `1px solid ${p.borderSoft}`,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  } as any,
  layerItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer',
    selectors: { ':hover': { background: '#F0F0F0' } },
  },
  layerSwatch: { width: 10, height: 10, borderRadius: 2, flexShrink: 0 },
  layerInfo: { flex: 1, minWidth: 0 },
  layerName: {
    fontSize: 13, fontWeight: 500, color: p.text,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  } as any,
  layerMeta: { fontSize: 11, color: p.text3 },

  /* Map container */
  mapWrap: { flex: 1, minHeight: 500, position: 'relative' } as any,

  /* Detail panel */
  detailPanel: {
    padding: 24, borderRadius: 4, background: '#FFFFFF',
    border: `1px solid ${p.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: 24,
    '@media (max-width: 768px)': { padding: 16 },
  } as any,
  detailHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  detailName: { fontSize: 18, fontWeight: 700, color: p.text },
  detailBadge: {
    display: 'inline-block', fontSize: 11, fontWeight: 600, color: p.text3,
    background: p.bg2, border: `1px solid ${p.borderSoft}`, borderRadius: 999,
    padding: '2px 10px', marginTop: 4,
  },
  closeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    selectors: { ':hover': { background: p.bg2 } },
  } as any,
  detailDesc: { fontSize: 13, color: p.text2, lineHeight: '20px', marginBottom: 16 },
  propsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 0 },
  propRow: {
    display: 'flex', padding: '8px 0', borderBottom: `1px solid ${p.borderSoft}`, fontSize: 13,
    '@media (max-width: 768px)': { flexDirection: 'column', gap: 2 },
  } as any,
  propKey: { width: 180, flexShrink: 0, fontWeight: 600, color: p.text2 },
  propValue: { flex: 1, color: p.text },

  /* Info bar */
  infoBar: {
    display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 4,
    background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.12)',
  },

  /* Centered states */
  centered: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 400, gap: 16,
  } as any,
});

/* ── Component ── */
export default function Geospatial() {
  const [layers, setLayers] = useState<SpatialLayer[]>([]);
  const [stats, setStats] = useState<SpatialStats | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [featureData, setFeatureData] = useState<Record<string, any>>({});
  const [selectedFeature, setSelectedFeature] = useState<FeatureProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Load layers & stats on mount ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [layersRes, statsRes] = await Promise.all([
        accessService.get<{ layers: SpatialLayer[] }>('/spatial/layers'),
        accessService.get<SpatialStats>('/spatial/stats'),
      ]);

      const loadedLayers = layersRes.data.layers || [];
      setLayers(loadedLayers);
      setStats(statsRes.data);

      // Enable first 2 layers by default
      const defaults = new Set<string>();
      loadedLayers.slice(0, 2).forEach((l) => defaults.add(l.layer_id));
      setActiveLayers(defaults);

      // Pre-fetch features for default layers
      const fetches: Record<string, any> = {};
      for (const l of loadedLayers.slice(0, 2)) {
        try {
          const fRes = await accessService.get(`/spatial/layers/${l.layer_id}/features`);
          fetches[l.layer_id] = fRes.data;
        } catch {
          /* ignore fetch errors for individual layers */
        }
      }
      setFeatureData(fetches);
    } catch (err: any) {
      console.error('[SPATIAL] Load error:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load spatial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Toggle a layer on/off ── */
  const toggleLayer = useCallback(async (layerId: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
        // Fetch features if not cached
        if (!featureData[layerId]) {
          accessService.get(`/spatial/layers/${layerId}/features`).then((res) => {
            setFeatureData((fd) => ({ ...fd, [layerId]: res.data }));
          }).catch(() => { /* swallow */ });
        }
      }
      return next;
    });
  }, [featureData]);

  /* ── KPI data ── */
  const kpis = stats ? [
    { icon: 'Globe', color: '#7C7CFF', bg: 'rgba(124,124,255,0.10)', label: 'SPATIAL LAYERS', value: String(stats.totalLayers), hint: 'Across all domains' },
    { icon: 'MapPin', color: '#34D399', bg: 'rgba(52,211,153,0.10)', label: 'TOTAL FEATURES', value: stats.totalFeatures.toLocaleString(), hint: 'Points & polygons' },
    { icon: 'LocationCircle', color: '#38BDF8', bg: 'rgba(56,189,248,0.10)', label: 'POINT LAYERS', value: String(stats.pointLayers), hint: 'Asset & facility data' },
    { icon: 'Nav2DMapView', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', label: 'AREA LAYERS', value: String(stats.polygonLayers), hint: 'Boundaries & zones' },
  ] : [];

  /* ── Render: loading state ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <Spinner size={SpinnerSize.large} label="Loading spatial data..." />
        </div>
      </div>
    );
  }

  /* ── Render: error state ── */
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error}
          </MessageBar>
        </div>
      </div>
    );
  }

  /* ── Property keys to exclude from detail table ── */
  const hiddenKeys = new Set([
    'feature_id', 'name', 'description', 'layer_name', 'layer_code', 'layer_color', 'layer_type',
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Header ── */}
        <div className={styles.headerRow}>
          <div className={styles.title}>Spatial Data Explorer</div>
          <div className={styles.subtitle}>
            Interactive map view of Manningham City Council spatial data. Toggle layers to explore
            council facilities, parks, infrastructure assets, ward boundaries, street trees and planning zones.
            Click any feature for detailed information.
          </div>
          <div className={styles.chipRow}>
            <span className={styles.chip}><Icon iconName="CityNext" styles={{ root: { fontSize: 12 } }} /> Manningham City Council</span>
            <span className={styles.chip}><Icon iconName="Globe" styles={{ root: { fontSize: 12 } }} /> {stats?.totalLayers || 0} Layers</span>
            <span className={styles.chip}><Icon iconName="MapPin" styles={{ root: { fontSize: 12 } }} /> {stats?.totalFeatures?.toLocaleString() || 0} Features</span>
            <span className={styles.chip}><Icon iconName="Shield" styles={{ root: { fontSize: 12 } }} /> PostGIS / GDA2020</span>
          </div>
        </div>

        {/* ── KPI Row ── */}
        {stats && (
          <div className={styles.kpiRow}>
            {kpis.map((k) => (
              <div key={k.label} className={styles.kpiCard}>
                <div className={styles.kpiIconWrap} style={{ background: k.bg, border: `1px solid ${k.color}30` }}>
                  <Icon iconName={k.icon} styles={{ root: { color: k.color, fontSize: 14 } }} />
                </div>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiValue}>{k.value}</div>
                <div className={styles.kpiHint}>{k.hint}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Map + Layer Panel ── */}
        <div className={styles.mapSection}>
          {/* Layer sidebar */}
          <div className={styles.layerPanel}>
            <div className={styles.layerPanelTitle}>
              <Icon iconName="MapLayers" styles={{ root: { fontSize: 13, color: p.primary } }} />
              Map Layers
            </div>
            {layers.map((layer) => {
              const isActive = activeLayers.has(layer.layer_id);
              return (
                <div
                  key={layer.layer_id}
                  className={styles.layerItem}
                  onClick={() => toggleLayer(layer.layer_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') toggleLayer(layer.layer_id); }}
                >
                  <div
                    className={styles.layerSwatch}
                    style={{ background: isActive ? layer.color : '#D0D0D0' }}
                  />
                  <div className={styles.layerInfo}>
                    <div className={styles.layerName}>{layer.name}</div>
                    <div className={styles.layerMeta}>
                      {layer.feature_count} {layer.layer_type === 'polygon' ? 'areas' : 'points'}
                    </div>
                  </div>
                  <Icon
                    iconName={isActive ? 'CheckboxComposite' : 'Checkbox'}
                    styles={{ root: { color: isActive ? p.primary : p.text3, fontSize: 16 } }}
                  />
                </div>
              );
            })}
          </div>

          {/* Leaflet map */}
          <div className={styles.mapWrap}>
            <MapContainer
              center={[-37.78, 145.13]}
              zoom={13}
              style={{ height: '100%', width: '100%', minHeight: 500 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {layers
                .filter((l) => activeLayers.has(l.layer_id) && featureData[l.layer_id])
                .map((layer) => {
                  const data = featureData[layer.layer_id];
                  if (!data || !data.features?.length) return null;

                  return (
                    <GeoJSON
                      key={`${layer.layer_id}-${data.features.length}`}
                      data={data}
                      pointToLayer={(_feature: any, latlng: L.LatLng) => {
                        return L.circleMarker(latlng, {
                          radius: 7,
                          fillColor: layer.color,
                          color: '#FFFFFF',
                          weight: 2,
                          fillOpacity: 0.85,
                        });
                      }}
                      style={
                        layer.layer_type === 'polygon'
                          ? () => ({
                              fillColor: layer.color,
                              color: layer.color,
                              weight: 2,
                              fillOpacity: 0.15,
                            })
                          : undefined
                      }
                      onEachFeature={(feature: any, leafletLayer: L.Layer) => {
                        const props = feature.properties || {};
                        leafletLayer.bindPopup(
                          `<div style="font-family:Segoe UI,sans-serif;min-width:180px">` +
                          `<div style="font-weight:700;font-size:14px;margin-bottom:4px">${props.name || 'Feature'}</div>` +
                          `<div style="font-size:11px;color:#707070;margin-bottom:6px">${props.layer_name || ''}</div>` +
                          `<div style="font-size:12px;color:#505050">${props.description || ''}</div>` +
                          `</div>`
                        );
                        leafletLayer.on('click', () => {
                          setSelectedFeature(props as FeatureProps);
                        });
                      }}
                    />
                  );
                })}
            </MapContainer>
          </div>
        </div>

        {/* ── Feature Detail Panel ── */}
        {selectedFeature && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailName}>{selectedFeature.name}</div>
                {selectedFeature.layer_name && (
                  <div className={styles.detailBadge}>{selectedFeature.layer_name}</div>
                )}
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedFeature(null)}
                aria-label="Close detail panel"
              >
                <Icon iconName="ChromeClose" styles={{ root: { fontSize: 12, color: p.text3 } }} />
              </button>
            </div>
            {selectedFeature.description && (
              <div className={styles.detailDesc}>{selectedFeature.description}</div>
            )}
            <div className={styles.propsGrid}>
              {Object.entries(selectedFeature)
                .filter(([key, val]) => !hiddenKeys.has(key) && val !== null && val !== undefined)
                .map(([key, val]) => (
                  <div key={key} className={styles.propRow}>
                    <span className={styles.propKey}>{formatKey(key)}</span>
                    <span className={styles.propValue}>{formatValue(val)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Info bar ── */}
        <div className={styles.infoBar}>
          <Icon iconName="Info" styles={{ root: { color: p.primary, fontSize: 16, flexShrink: 0 } }} />
          <span style={{ color: p.text2, fontSize: 12, lineHeight: '18px' }}>
            Spatial data is stored in PostGIS and served as GeoJSON. Layers are maintained by council GIS
            and asset management teams. Data is projected in GDA2020 (EPSG:4326 for web display).
            Toggle layers using the panel to explore different spatial datasets.
          </span>
        </div>

      </div>
    </div>
  );
}
