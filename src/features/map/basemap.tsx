import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AttributionControl, TileLayer } from 'react-leaflet';
import { buttonClass } from '../../shared/ui/button.tsx';
import { allowTiles, useTilesAllowed } from './tile-consent.ts';

// plain OpenStreetMap: the only raster basemap that needs no account at all.
// CARTO, Stadia and MapTiler all have free tiers and all want a key. swapping
// provider is this file plus the img-src line in vite.config.ts.
const URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// the tiles are the one request this site makes to somebody else, and it hands them the
// visitor's address. so the map starts without them and asks; pins, the circle and the
// clicks all work the same underneath
export const Basemap = () => {
  const allowed = useTilesAllowed();
  if (!allowed) return <TilesOff />;

  return (
    <>
      <TileLayer attribution={ATTRIBUTION} url={URL} maxZoom={19} />
      {/* prefix={false} drops Leaflet's own credit, which since 1.9 carries a
          flag. the OpenStreetMap one stays: that is the data licence, not
          decoration. */}
      <AttributionControl position="bottomright" prefix={false} />
    </>
  );
};

const TilesOff = () => {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);

  // Leaflet listens on the whole container: without this the button's click would also
  // drop a pin in the location picker and the wheel would zoom the map behind the panel
  useEffect(() => {
    if (!panel.current) return;
    L.DomEvent.disableClickPropagation(panel.current);
    L.DomEvent.disableScrollPropagation(panel.current);
  }, []);

  return (
    <div
      ref={panel}
      className="absolute inset-0 z-[1000] flex items-center justify-center bg-sunken/90 p-4"
    >
      <div className="max-w-xs space-y-3 text-center">
        <p className="text-sm font-medium">{t('map.consentTitle')}</p>
        <p className="text-xs text-muted">{t('map.consentBody')}</p>
        <button type="button" onClick={allowTiles} className={buttonClass('primary', 'sm')}>
          {t('map.consentButton')}
        </button>
      </div>
    </div>
  );
};
