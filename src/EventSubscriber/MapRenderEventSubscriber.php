<?php

declare(strict_types=1);

namespace Drupal\farm_land_styles\EventSubscriber;

use Drupal\farm_map\Event\MapRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Attaches the farm_land_styles behavior to maps that show asset GeoJSON layers.
 */
class MapRenderEventSubscriber implements EventSubscriberInterface {

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      MapRenderEvent::EVENT_NAME => 'onMapRender',
    ];
  }

  /**
   * React to the MapRenderEvent.
   *
   * @param \Drupal\farm_map\Event\MapRenderEvent $event
   *   The MapRenderEvent.
   */
  public function onMapRender(MapRenderEvent $event): void {
    // Add to maps that show the "All locations" GeoJSON layer.
    // This mirrors the condition farm_ui_map uses to add asset_type_layers.
    if (in_array($event->getMapType()->id(), ['default', 'geofield', 'asset_list'])) {
      $event->addBehavior('farm_land_styles');
      return;
    }

    // Also add when the locations behavior is present (per-type location layers).
    if (in_array('locations', $event->getMapBehaviors())) {
      $event->addBehavior('farm_land_styles');
    }
  }

}
