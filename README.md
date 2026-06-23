# Farm Land Styles

A farmOS module that adds per-asset map color and line style controls to land assets.

## Features

- **Map color** — choose from 22 preset colors for a land asset's outline and fill on the map.
- **Map line style** — choose Solid or Dashed for the outline.
- Styles are applied on all farmOS maps: the dashboard, the asset list map, asset edit forms, and the locations map.
- Assets without a color or line style set continue to use the default farmOS layer color.

## Requirements

- farmOS 4.x (Drupal 11)
- `farm_map` module (core farmOS)
- `farm_ui_map` module (core farmOS)
- `farm_land` module (core farmOS)

## Installation

1. Place this module in `web/modules/custom/farm_land_styles/`.
2. Enable it:

```bash
drush pm:enable farm_land_styles
```

No additional configuration is required.

## Usage

1. Open any **Land** asset and click **Edit**.
2. Set the **Map color** dropdown to a color.
3. Set the **Map line style** dropdown to **Solid** or **Dashed**.
4. Save the asset.

The chosen color and line style appear immediately on any farmOS map that shows that asset.

## Available colors

Blue, Sky blue, Cyan, Teal, Green, Lime, Dark green, Olive, Yellow, Amber, Orange, Red, Rose, Pink, Purple, Indigo, Navy, Brown, Maroon, Gray, Black, White.

## How it works

| Component | Purpose |
|-----------|---------|
| `hook_farm_entity_bundle_field_info()` | Adds `map_color` and `map_line_style` bundle fields to the `land` asset type. Drupal creates the storage tables on install. |
| `hook_entity_form_display_alter()` | Forces both fields to use the select-dropdown widget on the land asset edit form. |
| `hook_views_pre_view()` | Injects both fields into the `farm_asset_geojson` view so they appear as GeoJSON feature properties. |
| `MapRenderEventSubscriber` | Attaches the behavior library to maps that show asset GeoJSON layers (`default`, `geofield`, `asset_list`, and maps using the `locations` behavior). |
| `farmOS.map.behaviors.farm_land_styles` | Reads `map_color` and `map_line_style` from each GeoJSON feature and applies a per-feature OpenLayers style. Recurses into layer groups so dashboard layers are reached. |

## Uninstalling

```bash
drush pm:uninstall farm_land_styles
```

This removes the field tables and all configuration added by the module. Existing `map_color` and `map_line_style` values on land assets are deleted along with the tables.
