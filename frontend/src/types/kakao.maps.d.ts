declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: any);
  }

  class Marker {
    constructor(options: any);
    getPosition(): LatLng;
    setMap(map: Map | null): void;
  }

  class CustomOverlay {
    constructor(options: any);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
    setPosition(position: LatLng): void;
    getContent(): string | HTMLElement;
  }

  class Map {
    constructor(container: HTMLElement, options: any);
    setCenter(latlng: LatLng): void;
    setLevel(level: number, options?: any): void;
    getLevel(): number;
    panTo(latlng: LatLng): void;
    getBounds(): LatLngBounds;
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
    relayout(): void;
  }

  class LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }

  class MarkerClusterer {
    constructor(options: any);
    addMarker(marker: Marker): void;
    addMarkers(markers: Marker[]): void;
    removeMarker(marker: Marker): void;
    removeMarkers(markers: Marker[]): void;
    clear(): void;
    redraw(): void;
  }

  namespace event {
    function addListener(target: any, type: string, handler: Function): void;
    function removeListener(target: any, type: string, handler: Function): void;
  }

  function load(callback: Function): void;
}

interface Window {
  kakao: {
    maps: typeof kakao.maps;
  };
}
