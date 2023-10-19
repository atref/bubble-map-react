import * as React from "react";

import { Rect, format, CollectionView, httpRequest } from "@grapecity/wijmo";
import { Palettes } from "@grapecity/wijmo.chart";
import { FlexMap, ScatterMapLayer } from "@grapecity/wijmo.chart.map";
import { ComboBox } from "@grapecity/wijmo.input";
import { FlexMap as FlexMapReact, ScatterMapLayer as ScatterMapLayerReact, ColorScale } from "@grapecity/wijmo.react.chart.map";
import { ComboBox as ComboBoxReact } from '@grapecity/wijmo.react.input';
import { DetailLayerReact, LabeledLayerReact } from "./layers";
import { LabeledLayer } from "./layers/labeled-layer";
import { DetailLayer } from "./layers/detail-layer";
import { getCountryName, getLanguages, setLanguage, getName } from './tools/localization';
import { getContinents } from './tools/continents';
import { getCountries, getPopulationData, filterCities, mouseWheel } from "./tools/tools";

export class Map extends React.Component<any, any> {
  private homeRect: Rect | null = null;
  private flexMap: FlexMap | null = null;
  private countryLayer: LabeledLayer | null = null;
  private detailLayer: DetailLayer | null = null;
  private scatterLayer: ScatterMapLayer | null = null;

  constructor(props: object) {
    super(props);
    this.state = {
      continent: null,
      continents: new CollectionView(getContinents()),
      country: null,
      countries: null,
      populationData: null,
      cities: null,
      languages: getLanguages(),
      continentName: 'Continent',
      countryName: 'Country'
    };
  }

  render() {
    return (
      <div>
        <FlexMapReact
          initialized={this.initMap} tooltipContent={this.tooltip}>
          <LabeledLayerReact url='data/countries.json' labelClass='country-label'
            style={{ fill: 'rgba(153,216,201,0.4)', stroke: 'white', strokeWidth: 1.5 }}
            itemsSourceChanged={this.itemsSourceChanged} zoomLimit={5}
            formatLabel={(f: any) => getCountryName(f.properties.iso, f.properties.name)} />
          <DetailLayerReact
            style={{ fill: 'rgba(153,216,201,0.7)', stroke: 'white' }} />
          <ScatterMapLayerReact binding='x,y,population'
            symbolMinSize={5} symbolMaxSize={25}
            style={{ fill: 'rgba(44,162,95,1)', strokeWidth: 0 }}
            itemsSource={this.state.populationData}
          >
            <ColorScale binding='population' colors={Palettes.Diverging.RdYlBu} scale={(v: number) => 1 - v} />
          </ScatterMapLayerReact>
        </FlexMapReact>
        <div id="options">
          <button className="material-symbols-outlined" onClick={this.home}><span>language</span></button>
          <ComboBoxReact placeholder={this.state.continentName} displayMemberPath='label' isRequired={false}
            itemsSource={this.state.continents} selectedItem={this.state.continent}
            selectedIndexChanged={this.continentChanged} />
          <ComboBoxReact placeholder={this.state.countryName} displayMemberPath='name' isRequired={false}
            itemsSource={this.state.countries} selectedItem={this.state.country}
            selectedIndexChanged={this.countryChanged} />
          <ComboBoxReact itemsSource={this.state.languages}
            selectedIndexChanged={this.languageChanged} />
        </div>
      </div>
    );
  }

  itemsSourceChanged = (layer: LabeledLayer) => {
    if (!this.homeRect) {
      this.homeRect = layer.getGeoBBox();
      this.flexMap?.zoomTo(this.homeRect);
    }

    const view = new CollectionView(getCountries(layer));
    view.filter = (country) => {
      if (this.state.continent) {
        return country.continent === this.state.continent.name;
      } else {
        return true;
      }
    };
    view.currentItem = null;

    this.setState({ countries: view, populationData: getPopulationData(layer) });
  }

  initMap = (flexMap: FlexMap) => {
    this.flexMap = flexMap;
    this.countryLayer = flexMap.layers[0];
    this.detailLayer = flexMap.layers[1];
    this.scatterLayer = flexMap.layers[2];

    httpRequest('data/cities.json', {
      success: xhr => this.setState({ cities: JSON.parse(xhr.responseText) })
    });

    // update scatter depending on visible countries
    this.detailLayer?.viewChanged.addHandler(() => {
      if (this.scatterLayer && this.detailLayer) {
        this.scatterLayer.itemsSource = this.detailLayer.countries?.length > 0 ?
          filterCities(this.state.cities, this.detailLayer.countries) : this.state.populationData;
      }
    });

    // override default mouse wheel handler
    flexMap.hostElement.addEventListener('wheel', (e) => mouseWheel(flexMap, e), true);
  }

  home = () => {
    this.zoomTo(this.homeRect);
    if (this.detailLayer) {
      this.detailLayer.itemsSource = null;
    }
    this.setState({ continent: null, country: null });
  }

  continentChanged = (sender: any) => {
    this.setState({ continent: sender?.selectedItem, country: null },
      () => this.state.countries.refresh());

    let rect = this.homeRect;
    if (sender?.selectedItem?.bbox) {
      rect = sender?.selectedItem?.bbox;
    }

    this.zoomTo(rect);
  }

  countryChanged = (sender: any) => {
    let country = sender?.selectedItem;
    this.setState({ country: country });

    let rect = this.homeRect;
    if (country?.bbox) {
      rect = country?.bbox;
    }

    this.zoomTo(rect);
  }

  zoomTo = (rect:Rect|null) => {
    if (rect && this.flexMap) {
      this.flexMap.zoom = 1;
      this.flexMap.zoomTo(rect);
    }
  }

  languageChanged = (comboBox: ComboBox) => {
    setLanguage(comboBox.selectedItem, () => {
      this.flexMap?.invalidate(true);

      this.state.continents.sourceCollection = getContinents();
      this.state.continents.currentItem = null;

      if (this.countryLayer) {
        this.state.countries.sourceCollection = getCountries(this.countryLayer);
        this.state.countries.currentItem = null;
      };

      this.setState( { continentName:getName('Continent'), countryName:getName('Country')});
    });
  }

  tooltip(ht: any): string {
    const code: string = ht.iso;
    const name = ht.continent ? getCountryName(code, ht.name) : ht.name;

    let tt = code ?
      `<img class="tooltip" src="flags/${code.toLowerCase()}.png"/><b>${name}</b>`
      : `<b>{name}</b>`;

    if (ht?.population) {
      tt += format('<br>{label}: {population:n*}', { label: getName('Population'), population: ht.population });
    }

    return tt;
  }
}