import { AttributionControl, TileLayer } from 'react-leaflet';

// plain OpenStreetMap: the only raster basemap that needs no account at all.
// CARTO, Stadia and MapTiler all have free tiers and all want a key. swapping
// provider is this file plus the img-src line in vite.config.ts.
const URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const Basemap = () => (
  <>
    <TileLayer attribution={ATTRIBUTION} url={URL} maxZoom={19} />
    {/* prefix={false} drops Leaflet's own credit, which since 1.9 carries a
        flag. the OpenStreetMap one stays: that is the data licence, not
        decoration. */}
    <AttributionControl position="bottomright" prefix={false} />
  </>
);
