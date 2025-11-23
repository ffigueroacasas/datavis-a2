window.onload = () => {
  d3.csv('cars.csv').then((data) => {
    data.forEach((d) => {
      d['Retail Price'] = +d['Retail Price'];
      d['Dealer Cost'] = +d['Dealer Cost'];
      d.Cyl = +d.Cyl;
      d['Horsepower(HP)'] = +d['Horsepower(HP)'];
      d.AWD = +d.AWD;
      d['City Miles Per Gallon'] = +d['City Miles Per Gallon'];
      d['Engine Size (l)'] = +d['Engine Size (l)'];
    });

    // no rows with missing values
    data = data.filter((d) => {
      return (
        !isNaN(d['Retail Price']) &&
        !isNaN(
          d['Dealer Cost'] &&
            !isNaN(d.Cyl) &&
            !isNaN(d['Horsepower(HP)']) &&
            !isNaN(d.AWD) &&
            !isNaN(d['City Miles Per Gallon']) &&
            !isNaN(d['Engine Size (l)'])
        )
      );
    });

    // size of the whole graph
    const margin = { top: 40, right: 160, bottom: 60, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const extraRight = 240;
    const extraBottom = 240;
    const totalWidth = width + margin.left + margin.right + extraRight;
    const totalHeight = height + margin.top + margin.bottom + extraBottom;

    const svg = d3
      .select('body')
      .append('svg')
      .attr('width', totalWidth)
      .attr('height', totalHeight)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // scales
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Dealer Cost']))
      .nice()
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Retail Price']))
      .nice()
      .range([height, 0]);

    // encode type into color
    const types = Array.from(new Set(data.map((d) => d.Type))).sort();
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(types);

    // star plot attributes
    const radarAttrs = [
      'Engine Size (l)',
      'City Miles Per Gallon',
      'Cyl',
      'Horsepower(HP)',
      'Dealer Cost',
      'Retail Price',
    ];

    // normalize data for star plot
    const attrScales = {};

    attrScales['Engine Size (l)'] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Engine Size (l)']))
      .range([0, 1]);

    const cityVals = data
      .map((d) => d['City Miles Per Gallon'])
      .filter((v) => isFinite(v));
    const cityExtent = cityVals.length ? d3.extent(cityVals) : [0, 1];

    if (cityExtent[0] === cityExtent[1]) cityExtent[0] = cityExtent[0] - 1;
    attrScales['City Miles Per Gallon'] = d3
      .scaleLinear()
      .domain(cityExtent)
      .range([0, 1]);

    attrScales['Cyl'] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.Cyl))
      .range([0, 1]);

    attrScales['Horsepower(HP)'] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Horsepower(HP)']))
      .range([0, 1]);

    attrScales['Dealer Cost'] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Dealer Cost']))
      .range([0, 1]);

    attrScales['Retail Price'] = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d['Retail Price']))
      .range([0, 1]);

    // axes
    const xAxis = d3.axisBottom(x).ticks(8).tickFormat(d3.format(',.0f'));
    const yAxis = d3.axisLeft(y).ticks(8).tickFormat(d3.format(',.0f'));

    svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append('g').attr('class', 'y axis').call(yAxis);

    // axis labels
    svg
      .append('text')
      .attr('class', 'x label')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text('Dealer Cost');

    svg
      .append('text')
      .attr('class', 'y label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Retail Price');

    // info on select
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(255,255,255,0.9)')
      .style('padding', '6px 8px')
      .style('border', '1px solid #999')
      .style('border-radius', '4px')
      .style('font-family', 'sans-serif')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('display', 'none');

    // identify outliers
    const topN = 4;
    const byRetailDesc = data
      .slice()
      .sort((a, b) => b['Retail Price'] - a['Retail Price']);
    const byDealerDesc = data
      .slice()
      .sort((a, b) => b['Dealer Cost'] - a['Dealer Cost']);

    // create star plot
    const radarGroup = svg
      .append('g')
      .attr('class', 'radar')
      .attr(
        'transform',
        'translate(' +
          (width + Math.floor(extraRight / 2)) +
          ',' +
          Math.floor(height / 2) +
          ')'
      );

    const radarSize = 180;
    const radarCenter = { x: 0, y: 0 };
    const radarRadius = radarSize / 2;
    const radarN = radarAttrs.length;

    const radarAxes = radarGroup.append('g').attr('class', 'radar-axes');
    for (let i = 0; i < radarN; i++) {
      const angle = (Math.PI * 2 * i) / radarN - Math.PI / 2;
      const x2 = Math.cos(angle) * radarRadius;
      const y2 = Math.sin(angle) * radarRadius;
      radarAxes
        .append('line')
        .attr('x1', radarCenter.x)
        .attr('y1', radarCenter.y)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#bbb')
        .attr('stroke-width', 1);

      radarAxes
        .append('text')
        .attr('x', x2 * 1.08)
        .attr('y', y2 * 1.08)
        .attr(
          'text-anchor',
          Math.abs(x2) < 1e-6 ? 'middle' : x2 > 0 ? 'start' : 'end'
        )
        .attr('dy', '0.35em')
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')
        .text(radarAttrs[i]);
    }

    const radarPlot = radarGroup.append('g').attr('class', 'radar-plot');
    radarGroup.style('display', 'none');

    function drawRadar(d) {
      if (!d) {
        radarGroup.style('display', 'none');
        return;
      }
      // scale values for star plot
      const values = radarAttrs.map((a) => {
        const raw = d[a];
        const v = attrScales[a] ? attrScales[a](raw) : NaN;
        return isFinite(v) ? v : 0;
      });

      // build polygon points
      const points = values.map((v, i) => {
        const angle = (Math.PI * 2 * i) / radarN - Math.PI / 2;
        const r = v * radarRadius;
        return [Math.cos(angle) * r, Math.sin(angle) * r];
      });

      // polygon path
      const path =
        points
          .map((p, i) => {
            const xCoord = isFinite(p[0]) ? Math.round(p[0]) : 0;
            const yCoord = isFinite(p[1]) ? Math.round(p[1]) : 0;
            return (i === 0 ? 'M' : 'L') + xCoord + ',' + yCoord;
          })
          .join(' ') + ' Z';

      radarPlot.selectAll('*').remove();

      radarPlot
        .append('path')
        .attr('d', path)
        .attr('fill', color(d.Type))
        .attr('fill-opacity', 0.45)
        .attr('stroke', color(d.Type))
        .attr('stroke-width', 1.5);

      // points
      radarPlot
        .selectAll('circle')
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', (p) => p[0])
        .attr('cy', (p) => p[1])
        .attr('r', 3)
        .attr('fill', '#fff')
        .attr('stroke', color(d.Type))
        .attr('stroke-width', 1);

      // title
      radarPlot
        .append('text')
        .attr('x', 0)
        .attr('y', -radarRadius - 12)
        .attr('text-anchor', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .text(d.Name);

      radarGroup.style('display', null);
    }

    // draw datapoints
    svg
      .selectAll('circle.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', function (d) {
        return x(d['Dealer Cost']);
      })
      .attr('cy', function (d) {
        return y(d['Retail Price']);
      })
      .attr('r', 4)
      .attr('fill', function (d) {
        return color(d.Type);
      })
      .attr('opacity', 0.85)
      // black outline if AWD == 1
      .attr('stroke', function (d) {
        return +d.AWD === 1 ? '#000' : 'none';
      })
      .attr('stroke-width', function (d) {
        return +d.AWD === 1 ? 1.2 : 0;
      })
      .on('mouseover', function (d) {
        d3.select(this)
          .raise()
          .transition()
          .duration(80)
          .attr('r', 7)
          .attr('stroke', function (d2) {
            return +d2.AWD === 1 ? '#000' : '#333';
          })
          .attr('stroke-width', function (d2) {
            return +d2.AWD === 1 ? 1.8 : 1.2;
          });
      })
      .on('mouseout', function () {
        if (d3.select(this).classed('selected')) return;
        d3.select(this)
          .transition()
          .duration(80)
          .attr('r', 4)
          .attr('stroke', function (d2) {
            return +d2.AWD === 1 ? '#000' : 'none';
          })
          .attr('stroke-width', function (d2) {
            return +d2.AWD === 1 ? 1.2 : 0;
          });
      })
      .on('click', function (d) {
        d3.event.stopPropagation();
        svg
          .selectAll('.dot')
          .classed('selected', false)
          .transition()
          .duration(80)
          .attr('r', function (d2) {
            return 4;
          })
          .attr('stroke', function (d2) {
            return +d2.AWD === 1 ? '#000' : 'none';
          })
          .attr('stroke-width', function (d2) {
            return +d2.AWD === 1 ? 1.2 : 0;
          });

        d3.select(this)
          .classed('selected', true)
          .raise()
          .transition()
          .duration(80)
          .attr('r', 8)
          .attr('stroke', function (d2) {
            return +d2.AWD === 1 ? '#000' : '#333';
          })
          .attr('stroke-width', function (d2) {
            return +d2.AWD === 1 ? 1.8 : 1.4;
          });

        drawRadar(d);

        tooltip
          .style('display', 'block')
          .html(
            '<strong>' +
              (d.Name || '') +
              '</strong><br/>' +
              'Type: ' +
              (d.Type || '') +
              '<br/>' +
              'Engine size: ' +
              (d['Engine Size (l)'] || '') +
              '<br/>' +
              'City MPG: ' +
              (d['City Miles Per Gallon'] || '') +
              '<br/>' +
              'AWD: ' +
              (+d.AWD === 1 ? 'Yes' : 'No') +
              '<br/>' +
              'Cylinders: ' +
              (d.Cyl || '') +
              '<br/>' +
              'Horsepower: ' +
              (d['Horsepower(HP)'] || '') +
              '<br/>' +
              'Dealer Cost: $' +
              d3.format(',')(d['Dealer Cost']) +
              '<br/>' +
              'Retail Price: $' +
              d3.format(',')(d['Retail Price'])
          );
        var px = d3.event.pageX + 10;
        var py = d3.event.pageY + 10;
        tooltip.style('left', px + 'px').style('top', py + 'px');
      });

    d3.select('body').on('click', function () {
      tooltip.style('display', 'none');
      svg
        .selectAll('.dot')
        .classed('selected', false)
        .transition()
        .duration(80)
        .attr('r', 4)
        .attr('stroke', function (d2) {
          return +d2.AWD === 1 ? '#000' : 'none';
        })
        .attr('stroke-width', function (d2) {
          return +d2.AWD === 1 ? 1.2 : 0;
        });
      drawRadar(null);
    });

    // legends
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (width + 20) + ',0)');

    types.forEach(function (t, i) {
      let g = legend
        .append('g')
        .attr('transform', 'translate(0,' + i * 20 + ')');
      g.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color(t));
      g.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .text(t)
        .style('font-size', '12px')
        .style('font-family', 'sans-serif');
    });

    const awdY = types.length * 20 + 12;
    const awdG = legend
      .append('g')
      .attr('transform', 'translate(0,' + awdY + ')');
    awdG
      .append('circle')
      .attr('cx', 6)
      .attr('cy', 6)
      .attr('r', 6)
      .attr('fill', '#fff')
      .attr('stroke', '#000')
      .attr('stroke-width', 1.2);
    awdG
      .append('text')
      .attr('x', 18)
      .attr('y', 10)
      .text('Black outline = AWD')
      .style('font-size', '12px')
      .style('font-family', 'sans-serif');
  });
};
