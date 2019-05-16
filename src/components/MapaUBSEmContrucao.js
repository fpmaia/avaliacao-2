import React, { Component } from 'react';
import * as d3 from 'd3';
import * as topojson from "topojson-client";

class MapaGeografico extends Component {

  state = {
    br: {},
    analfabestimo: {},
  }

  locale = {
    decimal: ",",
    thousands: ".",
    grouping: [3],
    currency: ["R$", ""]
  }


  drawed = false;

  color = d3.scaleQuantize().domain([0, 40]).range(d3.schemeReds[9]);

  getData() {
    if (!("objects" in this.state.br)) {
      Promise.all([
        d3.json("/ubsemconstrucao.json"),
        d3.csv("/analfabetismo_municipios_brasil_2010.csv", ({ Município, rate, codigo_uf }) => [codigo_uf + '-' + Município, +rate]),
      ]).then(([br, analfabestimo]) => {

        this.states = new Map(br.objects.states.geometries.map(d => [d.id, d.properties]));

        this.cities = new Map(br.objects.cities.geometries.map(d => [d.id, d.properties]))

        this.setState({
          br: br,
          analfabestimo: analfabestimo,
        });

      }).catch(err => console.log('Error loading or parsing data.'));
    }
  }

  legend(g) {

    const x = d3.scaleLinear()
      .domain(d3.extent(this.color.domain()))
      .rangeRound([0, 260]);

    

    g.append("text")
      .attr("x", -510)
      .attr("y", -6)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(this.data.title);


  }

  drawChart(state) {

    let { br, analfabestimo } = state;

    if ("objects" in br && this.drawed === false) {

      this.drawed = true;

      this.data = Object.assign({ title: "UBS - Em Construção" });

      this.format = d3.formatDefaultLocale(this.locale).format(".1f");

      this.svg = d3.select("svg.mapa")
        .style("width", "100%");

      let width = this.svg.attr('width');
      let height = this.svg.attr('height');

      this.deltax = 900;
      //this.deltax = 900;

      var projection = d3.geoMercator()
        .scale(750)
        .translate([width / 2 + this.deltax, height / 2 - 200]);

      this.path = d3.geoPath().projection(projection);

  const gubsemconstrucao = this.svg.append("g")
        .attr("id", "gubsemconstrucao");
  const gstates = this.svg.append("g")
        .attr("id", "gstates");
  const gcities = this.svg.append("g")
        .attr("id", "gcities");
  
  gubsemconstrucao.selectAll("path")
        .data(topojson.feature(br, br.objects['ubsemconstrucao']).features)
        .join("path")
            .attr("fill", 'green')
            .attr("stroke", "black")
            .attr("id", d => `municipio_${d.id}`)
            .attr("class", "feature")
            .attr("d", this.path)
            .attr("stroke-width", 0.3)
            .attr("stroke-linejoin", "round")
              .append("title")
              .text(d => d.properties.no_cidade);
                  
    gcities.selectAll("path")
        .data(topojson.feature(br, br.objects.cities).features)
        .join("path")
            .attr("fill", 'grey')
            .attr("stroke", "black")
            .attr("id", d => `municipio_${d.id}`)
            .attr("class", "feature")
            .attr("d", this.path)
            .attr("fill-opacity", 0.5)
            .attr("stroke-width", 0.3)
            .attr("stroke-linejoin", "round")
              .append("title")
              .text(d => d.properties.name);
  

   gstates.selectAll("path")
      .data(topojson.feature(br, br.objects.states).features)
      .join("path")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("id", d => `feature_${d.id}`)
          .attr("stroke-width", 1.3)
          .attr("stroke-linejoin", "round")
           .attr("fill-opacity", 0)
          .attr("d", this.path)
          .append("title")
              .text(d => d.properties.name);;

      this.zoom = d3.zoom()
        .on("zoom", () => {
          this.zoomed = true;
          d3.select('#reset_button')
            .attr("display", "block");
          gstates.attr("transform", d3.event.transform);
          gcities.attr("transform", d3.event.transform);
          gubsemconstrucao.attr("transform", d3.event.transform);
        });
      
      this.svg.call(this.zoom);

    }
  }

  componentDidMount() {
    this.getData();
  }

  render() {
    return (
      <div>
        <svg className="mapa" width="800" height="560"></svg>
        {this.drawChart(this.state)}
      </div>
    );

  }

}

export default MapaGeografico;