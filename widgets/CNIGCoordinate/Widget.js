define([
    "dojo/_base/declare",
    './WidgetOriginal',
    'dojo/_base/lang',
    "esri/tasks/ProjectParameters",
    'esri/SpatialReference'
], function(declare, CoordinateWidgetOri, lang, ProjectParameters, SpatialReference){
  return declare([CoordinateWidgetOri], {
    canShowInClient: function(wkid) {
      //Permitimos que todos los sistemas de coordenadas se muestren en tiempo real
      return true;
    },

    _displayOnClient: function(mapPoint) {
        var outUnit = this.selectedItem.get('outputUnit');

        var x = mapPoint.x,
          y = mapPoint.y;

        var normalizedPoint = null;
        var convertInClient = (this._mapWkid === 4326 && this._isWebMercator(this.selectedWkid)) ||
          (this._isWebMercator(this._mapWkid) && this.selectedWkid === 4326);
        var options = this.selectedItem.get('options');

        // make sure longitude values stays within -180/180
        normalizedPoint = mapPoint.normalize();
        if (options.isGeographicUnit) {
          x = normalizedPoint.getLongitude() || x;
        }
        if (options.isGeographicUnit) {
          y = normalizedPoint.getLatitude() || y;
        }

        if (convertInClient) {
          // process special case
          if (mapPoint.spatialReference.wkid === 4326 && this._isWebMercator(this.selectedWkid)) {
            if ("MGRS" === outUnit || "USNG" === outUnit) {
              this._displayUsngOrMgrs(
                outUnit,
                normalizedPoint.getLatitude(),
                normalizedPoint.getLongitude()
              );
            } else if (options.isGeographicUnit) {
              this._displayDegOrDms(outUnit, y, x);
            } else if (options.isProjectUnit) {
              var mCoord = webMercatorUtils.lngLatToXY(x, y);
              this._displayProject(outUnit, mCoord[1], mCoord[0]);
            }
          } else if (mapPoint.spatialReference.isWebMercator() &&
            this.selectedWkid === 4326) {
            if ("MGRS" === outUnit || "USNG" === outUnit) {
              this._displayUsngOrMgrs(
                outUnit,
                normalizedPoint.getLatitude(),
                normalizedPoint.getLongitude()
              );
            } else if (options.isGeographicUnit) {
              this._displayDegOrDms(outUnit, y, x);
            }
          }
        } else {
          // use default units
          if (options.defaultUnit === outUnit) {
            this._displayCoordinatesByOrder(this._toFormat(x), this._toFormat(y));
            this.coordinateInfo.innerHTML += " " + this._unitToNls(outUnit);
            return;
          }
        
        //Si existe una petición de coordenadas pendiente limpiamos el timeout
        if (this.tokenIsPendingToProject && this.tokenIsPendingToProject != null) {
          clearTimeout(this.tokenIsPendingToProject);
        }

        //Si dejamos parado el raton durante 250ms, entonces se manda la petición y se muestran las coordenadas
        this.tokenIsPendingToProject = setTimeout(lang.hitch(this, function() {
          var params = new ProjectParameters();
          var outWkid = null;
          params.geometries = [mapPoint];

          if (options.isProjectedCS) {
            if (options.isProjectUnit) {
              outWkid = this.selectedWkid;
            } else { // geoUnit or USNG, MGRS
              outWkid = options.spheroidCS;
            }
          } else if (options.isGeographicCS) {
            outWkid = this.selectedWkid;
          }

          if (this.selectedTfWkid) {
            params.transformation = new SpatialReference(parseInt(this.selectedTfWkid, 10));
            params.transformForward = JSON.parse(this.forward);
          }

          params.outSR = new SpatialReference(parseInt(outWkid, 10));

          esriConfig.defaults.geometryService.project(params,
            lang.hitch(this, function(geometries) {
              this.tokenIsPendingToProject = null;
              var mapPoint = geometries[0];
              var normalizedPoint = mapPoint.normalize();
              var x = mapPoint.x;
              var y = mapPoint.y;
              if (options.isGeographicUnit) {
                x = normalizedPoint.getLongitude() || x;
              }
              if (options.isGeographicUnit) {
                y = normalizedPoint.getLatitude() || y;
              }

              if ("MGRS" === outUnit || "USNG" === outUnit) {
                this._displayUsngOrMgrs(
                  outUnit,
                  normalizedPoint.getLatitude(),
                  normalizedPoint.getLongitude()
                );
              } else if (options.isGeographicUnit) {
                this._displayDegOrDms(outUnit, y, x);
              } else if (options.isProjectedCS) {
                this._displayProject(outUnit, y, x);
              }            
            }),
            lang.hitch(this, function(msg) {
              this.tokenIsPendingToProject = null;
              console.log("Error al proyectar: " + (msg.message || msg.toString()));
              this.coordinateInfo.innerHTML = this.nls.hintMessage;
            })
          );
        }), 250)
      }
    }
  });
}); 