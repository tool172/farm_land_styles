(function () {
  'use strict';

  const DASH = {
    solid:  null,
    dashed: [10, 5],
  };

  const GEOM_DEFAULTS = {
    line:    { color: '#6b7280', dash: [10, 5], width: 2 },
    polygon: { color: '#166534', dash: null,    width: 2 },
    other:   { color: '#3b82f6', dash: null,    width: 2 },
  };

  // OL constructor references extracted lazily from the first real styled
  // feature. farmOS-map bundles OL internally; we reuse its constructors by
  // inspecting whatever style the existing layer returns for a real feature.
  let StyleCls = null, StrokeCls = null, FillCls = null;

  function tryBootstrap(feature, layerStyleFn) {
    // Retry until we have both StyleCls and StrokeCls.
    if (StrokeCls) return true;
    if (!layerStyleFn) return false;
    try {
      const raw    = layerStyleFn(feature, 1);
      const styles = Array.isArray(raw) ? raw : [raw];
      for (const s of styles) {
        if (!s) continue;
        if (!StyleCls) StyleCls = s.constructor;
        if (!StrokeCls && s.getStroke) StrokeCls = s.getStroke()?.constructor;
        if (!FillCls   && s.getFill)   FillCls   = s.getFill()?.constructor;
        if (StyleCls && StrokeCls) break;
      }
    } catch (e) {}
    return !!(StyleCls && StrokeCls);
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function buildStyle(feature) {
    const geomType  = feature.getGeometry()?.getType() || '';
    const isLine    = geomType === 'LineString'  || geomType === 'MultiLineString';
    const isPolygon = geomType === 'Polygon'     || geomType === 'MultiPolygon';

    let cfg;
    if (isLine)         cfg = { ...GEOM_DEFAULTS.line };
    else if (isPolygon) cfg = { ...GEOM_DEFAULTS.polygon };
    else                cfg = { ...GEOM_DEFAULTS.other };

    const color = feature.get('map_color');
    if (color && color.startsWith('#')) {
      cfg.color = color;
    }

    const lineStyle = feature.get('map_line_style');
    if (lineStyle !== undefined && DASH[lineStyle] !== undefined) {
      cfg.dash = DASH[lineStyle];
    }

    const strokeOpts = { color: cfg.color, width: cfg.width };
    if (cfg.dash) {
      strokeOpts.lineDash = cfg.dash;
    }

    const styleOpts = { stroke: new StrokeCls(strokeOpts) };
    if (isPolygon && FillCls) {
      styleOpts.fill = new FillCls({ color: hexToRgba(cfg.color, 0.08) });
    }
    return new StyleCls(styleOpts);
  }

  function getLayerUrl(source) {
    const raw = source.getUrl?.() ?? source.url_ ?? source.urls_?.[0];
    if (!raw) return '';
    return raw instanceof URL ? raw.toString() : String(raw);
  }

  function isGeoJsonLayer(layer) {
    if (typeof layer.setStyle !== 'function') return false;
    const source = layer.getSource?.();
    if (!source) return false;
    return /\/assets\/geojson\//.test(getLayerUrl(source));
  }

  function applyToLayer(layer) {
    if (!isGeoJsonLayer(layer)) return;

    const source      = layer.getSource();
    // Capture the original style for OL constructor bootstrap.
    // Do not replace the layer style — instead use per-feature setStyle() so
    // non-custom features keep their default appearance unchanged.
    const layerStyleFn = layer.getStyleFunction();

    function styleFeature(feature) {
      const mapColor     = feature.get('map_color');
      const mapLineStyle = feature.get('map_line_style');
      if (!mapColor && !mapLineStyle) return;

      if (!tryBootstrap(feature, layerStyleFn)) return;

      feature.setStyle(buildStyle(feature));
    }

    // Features already in the source (loaded before this behavior ran).
    if (typeof source.getFeatures === 'function') {
      source.getFeatures().forEach(styleFeature);
    }

    // Features loaded after this behavior attaches.
    source.on('addfeature', function (event) {
      styleFeature(event.feature);
    });
  }

  // Recurse through layer groups so nested vector layers are reached.
  function traverseLayer(layerOrGroup) {
    if (typeof layerOrGroup.getLayers === 'function') {
      layerOrGroup.getLayers().forEach(traverseLayer);
      layerOrGroup.getLayers().on('add', function (event) {
        traverseLayer(event.element);
      });
    } else {
      applyToLayer(layerOrGroup);
    }
  }

  farmOS.map.behaviors.farm_land_styles = {
    // Run after asset_type_layers (weight 0) so layer groups already exist.
    weight: 10,

    attach: function (instance) {
      instance.map.getLayers().forEach(traverseLayer);
      instance.map.getLayers().on('add', function (event) {
        traverseLayer(event.element);
      });
    },
  };
}());
